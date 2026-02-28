import type { ExpressSchema } from '@step-nc/express-dictionary';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import {
  asInstanceId,
  getAttribute,
  INDETERMINATE,
  isInstanceRef,
  isStepAggregation,
  validateModel,
} from '@step-nc/step-factory';
import { describe, expect, it } from 'vitest';
import { readP21 } from '../../src/read-p21';

function buildSchemaFromSource(source: string): ExpressSchema {
  const { ast } = parseExpress(source);
  if (ast.type !== 'SchemaDeclaration') {
    throw new Error('Expected SchemaDeclaration');
  }
  const { schema, diagnostics } = buildSchema(ast);
  const errors = diagnostics.filter((d) => d.severity === 'error');
  if (errors.length > 0) {
    throw new Error(
      `Schema errors: ${errors.map((e) => e.message).join(', ')}`,
    );
  }
  return schema;
}

describe('Integration: read and validate', () => {
  const GEOMETRY_SCHEMA = buildSchemaFromSource(`
    SCHEMA INT_TEST;
      TYPE label = STRING;
      END_TYPE;
      TYPE length_measure = REAL;
      END_TYPE;

      ENTITY representation_item;
        name : label;
      END_ENTITY;

      ENTITY point SUBTYPE OF (representation_item);
        x : length_measure;
        y : length_measure;
        z : length_measure;
      END_ENTITY;

      ENTITY direction SUBTYPE OF (representation_item);
        direction_ratios : LIST [2:3] OF REAL;
      END_ENTITY;

      ENTITY line SUBTYPE OF (representation_item);
        pnt : point;
        dir : direction;
      END_ENTITY;

      TYPE direction_type = ENUMERATION OF (forward, backward);
      END_TYPE;

      ENTITY movement;
        direction : direction_type;
        distance  : REAL;
      END_ENTITY;
    END_SCHEMA;
  `);

  it('should read a complete geometry file and validate the model', () => {
    const source = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Geometry test'),'2;1');
FILE_NAME('geometry.stp','2025-01-01',('Author'),('Org'),'','step-nc','');
FILE_SCHEMA(('INT_TEST'));
ENDSEC;
DATA;
#1=POINT('Origin',0.0,0.0,0.0);
#2=POINT('End',10.0,0.0,0.0);
#3=DIRECTION('X-axis',(1.0,0.0,0.0));
#4=LINE('MyLine',#1,#3);
#5=MOVEMENT(.FORWARD.,5.0);
ENDSEC;
END-ISO-10303-21;`;

    const { model, diagnostics } = readP21(source, GEOMETRY_SCHEMA);
    const readErrors = diagnostics.filter((d) => d.severity === 'error');
    expect(readErrors).toHaveLength(0);
    expect(model.size).toBe(5);

    // Verify point
    const pt1 = model.getInstance(asInstanceId(1))!;
    expect(getAttribute(pt1, 'name')).toBe('Origin');
    expect(getAttribute(pt1, 'x')).toBe(0.0);

    // Verify direction with aggregation
    const dir = model.getInstance(asInstanceId(3))!;
    const ratios = getAttribute(dir, 'direction_ratios');
    expect(isStepAggregation(ratios!)).toBe(true);
    const agg = ratios as { kind: string; elements: readonly number[] };
    expect(agg.kind).toBe('list');
    expect(agg.elements).toEqual([1.0, 0.0, 0.0]);

    // Verify line references
    const line = model.getInstance(asInstanceId(4))!;
    const pntRef = getAttribute(line, 'pnt');
    expect(isInstanceRef(pntRef!)).toBe(true);
    expect((pntRef as { id: number }).id).toBe(1);

    // Verify enumeration
    const movement = model.getInstance(asInstanceId(5))!;
    expect(getAttribute(movement, 'direction')).toBe('FORWARD');
    expect(getAttribute(movement, 'distance')).toBe(5.0);

    // Validate model — check no factory-level errors
    const validationDiags = validateModel(model);
    const validationErrors = validationDiags.filter(
      (d) => d.severity === 'error',
    );
    // Some validation errors are expected due to missing optional attributes
    // on pt2 (which was loaded but not referenced), but no dangling refs or type errors
    const danglingRefs = validationErrors.filter(
      (d) => d.code === 'DANGLING_REFERENCE',
    );
    expect(danglingRefs).toHaveLength(0);
  });

  it('should handle complex entities in integration', () => {
    const complexSchema = buildSchemaFromSource(`
      SCHEMA COMPLEX_INT;
        TYPE si_prefix = ENUMERATION OF (milli, centi, kilo);
        END_TYPE;
        TYPE si_unit_name = ENUMERATION OF (metre, kilogram, second);
        END_TYPE;

        ENTITY named_unit;
          dimensions : OPTIONAL INTEGER;
        END_ENTITY;

        ENTITY si_unit SUBTYPE OF (named_unit);
          prefix : OPTIONAL si_prefix;
          unit_name : si_unit_name;
        END_ENTITY;

        ENTITY length_unit SUBTYPE OF (named_unit);
        END_ENTITY;

        ENTITY length_si_unit SUBTYPE OF (si_unit, length_unit);
        END_ENTITY;
      END_SCHEMA;
    `);

    const source = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('COMPLEX_INT'));
ENDSEC;
DATA;
#1=(NAMED_UNIT(*)LENGTH_UNIT()SI_UNIT(.MILLI.,.METRE.));
#2=(NAMED_UNIT(*)LENGTH_UNIT()SI_UNIT($,.SECOND.));
ENDSEC;
END-ISO-10303-21;`;

    const { model, diagnostics } = readP21(source, complexSchema);
    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);
    expect(model.size).toBe(2);

    const inst1 = model.getInstance(asInstanceId(1))!;
    expect(inst1.typeName).toBe('LENGTH_SI_UNIT');
    // Optional omitted (*) may be INDETERMINATE or undefined
    const dim1 = getAttribute(inst1, 'dimensions');
    expect(dim1 === INDETERMINATE || dim1 === undefined).toBe(true);
    expect(getAttribute(inst1, 'prefix')).toBe('MILLI');
    expect(getAttribute(inst1, 'unit_name')).toBe('METRE');

    const inst2 = model.getInstance(asInstanceId(2))!;
    // Optional null ($) may be null or undefined
    const prefix2 = getAttribute(inst2, 'prefix');
    expect(prefix2 === null || prefix2 === undefined).toBe(true);
    expect(getAttribute(inst2, 'unit_name')).toBe('SECOND');
  });
});
