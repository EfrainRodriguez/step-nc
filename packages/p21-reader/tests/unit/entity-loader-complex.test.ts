import type { ExpressSchema } from '@step-nc/express-dictionary';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { parseP21 } from '@step-nc/p21-parser';
import {
  asInstanceId,
  getAttribute,
  INDETERMINATE,
  StepModel,
} from '@step-nc/step-factory';
import { describe, expect, it } from 'vitest';
import { loadEntities } from '../../src/entity-loader';

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

const COMPLEX_SCHEMA = buildSchemaFromSource(`
  SCHEMA COMPLEX_TEST;
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

describe('entity-loader (complex entities)', () => {
  it('should load a complex entity with multiple records', () => {
    const p21 = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('COMPLEX_TEST'));
ENDSEC;
DATA;
#1=(NAMED_UNIT(*)LENGTH_UNIT()SI_UNIT(.MILLI.,.METRE.));
ENDSEC;
END-ISO-10303-21;`;

    const { ast } = parseP21(p21);
    const model = new StepModel(COMPLEX_SCHEMA);
    const { diagnostics } = loadEntities(ast.data, COMPLEX_SCHEMA, model, true);

    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);
    expect(model.size).toBe(1);

    const instance = model.getInstance(asInstanceId(1));
    expect(instance).toBeDefined();
    expect(instance!.typeName).toBe('LENGTH_SI_UNIT');
    // Optional omitted (*) may be stored as INDETERMINATE or left unset (undefined)
    const dimensions = getAttribute(instance!, 'dimensions');
    expect(dimensions === INDETERMINATE || dimensions === undefined).toBe(true);
    expect(getAttribute(instance!, 'prefix')).toBe('MILLI');
    expect(getAttribute(instance!, 'unit_name')).toBe('METRE');
  });

  it('should create a single instance from complex entity', () => {
    const p21 = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('COMPLEX_TEST'));
ENDSEC;
DATA;
#10=(NAMED_UNIT(7)LENGTH_UNIT()SI_UNIT($,.KILOGRAM.));
ENDSEC;
END-ISO-10303-21;`;

    const { ast } = parseP21(p21);
    const model = new StepModel(COMPLEX_SCHEMA);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { diagnostics } = loadEntities(ast.data, COMPLEX_SCHEMA, model, true);

    expect(model.size).toBe(1);

    const instance = model.getInstance(asInstanceId(10));
    expect(instance).toBeDefined();
    expect(getAttribute(instance!, 'dimensions')).toBe(7);
    // Optional null ($) may be stored as null or left unset (undefined)
    const prefix = getAttribute(instance!, 'prefix');
    expect(prefix === null || prefix === undefined).toBe(true);
    expect(getAttribute(instance!, 'unit_name')).toBe('KILOGRAM');
  });
});
