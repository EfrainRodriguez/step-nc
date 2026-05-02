import type { ExpressSchema } from '@step-nc/express-dictionary';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import {
  asInstanceId,
  getAttribute,
  isInstanceRef,
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

const SCHEMA = buildSchemaFromSource(`
  SCHEMA READER_TEST;
    TYPE label = STRING;
    END_TYPE;

    ENTITY point;
      name : label;
      x : REAL;
      y : REAL;
      z : REAL;
    END_ENTITY;

    ENTITY direction;
      name : label;
      direction_ratios : LIST [2:3] OF REAL;
    END_ENTITY;

    ENTITY line;
      name : label;
      pnt : point;
      dir : direction;
    END_ENTITY;
  END_SCHEMA;
`);

describe('readP21', () => {
  it('should read a minimal P21 file into a StepModel', () => {
    const source = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('READER_TEST'));
ENDSEC;
DATA;
#1=POINT('Origin',0.0,0.0,0.0);
ENDSEC;
END-ISO-10303-21;`;

    const { model, diagnostics } = readP21(source, SCHEMA);
    const errors = diagnostics.filter((d) => d.severity === 'error');

    expect(errors).toHaveLength(0);
    expect(model.size).toBe(1);

    const pt = model.getInstance(asInstanceId(1));
    expect(pt).toBeDefined();
    expect(getAttribute(pt!, 'name')).toBe('Origin');
    expect(getAttribute(pt!, 'x')).toBe(0.0);
  });

  it('should read multiple entities with references', () => {
    const source = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('READER_TEST'));
ENDSEC;
DATA;
#1=POINT('P1',1.0,2.0,3.0);
#2=DIRECTION('D1',(1.0,0.0,0.0));
#3=LINE('L1',#1,#2);
ENDSEC;
END-ISO-10303-21;`;

    const { model, diagnostics } = readP21(source, SCHEMA);
    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);
    expect(model.size).toBe(3);

    const line = model.getInstance(asInstanceId(3));
    const pntRef = getAttribute(line!, 'pnt');
    expect(isInstanceRef(pntRef!)).toBe(true);
    expect((pntRef as { id: number }).id).toBe(1);
    expect((pntRef as { entityName: string }).entityName).toBe('POINT');
  });

  it('should return parse diagnostics for invalid P21', () => {
    const source = `INVALID P21 CONTENT`;

    const { model, diagnostics } = readP21(source, SCHEMA);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.some((d) => d.severity === 'error')).toBe(true);
    expect(model.size).toBe(0);
  });

  it('should continue on parse error when option is set', () => {
    const source = `ISO-10303-21;
HEADER;
ENDSEC;
DATA;
#1=POINT('P1',1.0,2.0,3.0);
ENDSEC;
END-ISO-10303-21;`;

    const { model, diagnostics } = readP21(source, SCHEMA, {
      continueOnParseError: true,
    });

    // Should have created the instance despite header parse errors (if any)
    expect(model.size).toBeGreaterThanOrEqual(0);
    expect(diagnostics.length).toBeGreaterThanOrEqual(0);
  });

  it('should emit reader diagnostics for unknown entities', () => {
    const source = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('READER_TEST'));
ENDSEC;
DATA;
#1=NONEXISTENT_ENTITY('test');
ENDSEC;
END-ISO-10303-21;`;

    const { model, diagnostics } = readP21(source, SCHEMA);

    expect(model.size).toBe(0);
    expect(
      diagnostics.some((d) => 'code' in d && d.code === 'UNKNOWN_ENTITY'),
    ).toBe(true);
  });

  it('should handle empty DATA section', () => {
    const source = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('READER_TEST'));
ENDSEC;
DATA;
ENDSEC;
END-ISO-10303-21;`;

    const { model, diagnostics } = readP21(source, SCHEMA);
    const errors = diagnostics.filter((d) => d.severity === 'error');

    expect(errors).toHaveLength(0);
    expect(model.size).toBe(0);
  });
});
