import type { ExpressSchema } from '@step-nc/express-dictionary';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import {
  asInstanceId,
  getAttribute,
  isInstanceRef,
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

describe('Integration: forward references', () => {
  const SCHEMA = buildSchemaFromSource(`
    SCHEMA FWD_TEST;
      TYPE label = STRING;
      END_TYPE;

      ENTITY point;
        name : label;
        x : REAL;
        y : REAL;
      END_ENTITY;

      ENTITY line;
        name : label;
        start_point : point;
        end_point   : point;
      END_ENTITY;

      ENTITY shape;
        name   : label;
        border : line;
      END_ENTITY;
    END_SCHEMA;
  `);

  it('should resolve forward references when #2 appears before #1', () => {
    const source = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('FWD_TEST'));
ENDSEC;
DATA;
#3=LINE('L1',#1,#2);
#1=POINT('Start',0.0,0.0);
#2=POINT('End',10.0,5.0);
ENDSEC;
END-ISO-10303-21;`;

    const { model, diagnostics } = readP21(source, SCHEMA);
    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);
    expect(model.size).toBe(3);

    const line = model.getInstance(asInstanceId(3))!;
    const startRef = getAttribute(line, 'start_point');
    const endRef = getAttribute(line, 'end_point');

    expect(isInstanceRef(startRef!)).toBe(true);
    expect((startRef as { id: number }).id).toBe(1);
    expect((startRef as { entityName: string }).entityName).toBe('POINT');

    expect(isInstanceRef(endRef!)).toBe(true);
    expect((endRef as { id: number }).id).toBe(2);
    expect((endRef as { entityName: string }).entityName).toBe('POINT');

    // Model validation should pass with no dangling references
    const validationDiags = validateModel(model);
    const danglingRefs = validationDiags.filter(
      (d) => d.code === 'DANGLING_REFERENCE',
    );
    expect(danglingRefs).toHaveLength(0);
  });

  it('should resolve deeply nested forward references', () => {
    const source = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('FWD_TEST'));
ENDSEC;
DATA;
#4=SHAPE('S1',#3);
#3=LINE('L1',#1,#2);
#2=POINT('End',10.0,5.0);
#1=POINT('Start',0.0,0.0);
ENDSEC;
END-ISO-10303-21;`;

    const { model, diagnostics } = readP21(source, SCHEMA);
    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);
    expect(model.size).toBe(4);

    const shape = model.getInstance(asInstanceId(4))!;
    const borderRef = getAttribute(shape, 'border');
    expect(isInstanceRef(borderRef!)).toBe(true);
    expect((borderRef as { id: number }).id).toBe(3);
    expect((borderRef as { entityName: string }).entityName).toBe('LINE');

    const validationDiags = validateModel(model);
    const danglingRefs = validationDiags.filter(
      (d) => d.code === 'DANGLING_REFERENCE',
    );
    expect(danglingRefs).toHaveLength(0);
  });

  it('should report dangling ref when target instance does not exist', () => {
    const source = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('FWD_TEST'));
ENDSEC;
DATA;
#1=LINE('L1',#99,#98);
ENDSEC;
END-ISO-10303-21;`;

    const { diagnostics } = readP21(source, SCHEMA);
    const danglingDiags = diagnostics.filter(
      (d) => 'code' in d && d.code === 'DANGLING_ENTITY_REF',
    );
    expect(danglingDiags.length).toBeGreaterThanOrEqual(2);
  });
});
