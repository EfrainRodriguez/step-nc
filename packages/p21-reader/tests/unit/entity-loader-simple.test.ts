import type { ExpressSchema } from '@step-nc/express-dictionary';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { parseP21 } from '@step-nc/p21-parser';
import {
  asInstanceId,
  getAttribute,
  isInstanceRef,
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

const SCHEMA = buildSchemaFromSource(`
  SCHEMA LOADER_TEST;
    TYPE label = STRING;
    END_TYPE;

    TYPE length_measure = REAL;
    END_TYPE;

    ENTITY point;
      name : label;
      x : length_measure;
      y : length_measure;
      z : length_measure;
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

const ORIENTED_EDGE_SCHEMA = buildSchemaFromSource(`
  SCHEMA ORIENTED_TEST;
    ENTITY edge;
      edge_start : INTEGER;
      edge_end   : INTEGER;
    END_ENTITY;

    ENTITY oriented_edge SUBTYPE OF (edge);
      orientation : BOOLEAN;
    DERIVE
      SELF\\edge.edge_start : INTEGER := 100;
    END_ENTITY;
  END_SCHEMA;
`);

describe('entity-loader (simple entities)', () => {
  it('should load a simple entity with all attributes', () => {
    const p21 = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('LOADER_TEST'));
ENDSEC;
DATA;
#1=POINT('Origin',0.0,0.0,0.0);
ENDSEC;
END-ISO-10303-21;`;

    const { ast } = parseP21(p21);
    const model = new StepModel(SCHEMA);
    const { diagnostics } = loadEntities(ast.data, SCHEMA, model, true);

    expect(diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
    expect(model.size).toBe(1);

    const instance = model.getInstance(asInstanceId(1));
    expect(instance).toBeDefined();
    expect(instance!.typeName).toBe('POINT');
    expect(getAttribute(instance!, 'name')).toBe('Origin');
    expect(getAttribute(instance!, 'x')).toBe(0.0);
    expect(getAttribute(instance!, 'y')).toBe(0.0);
    expect(getAttribute(instance!, 'z')).toBe(0.0);
  });

  it('should load multiple entities with cross-references', () => {
    const p21 = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('LOADER_TEST'));
ENDSEC;
DATA;
#1=POINT('P1',1.0,2.0,3.0);
#2=DIRECTION('D1',(1.0,0.0,0.0));
#3=LINE('L1',#1,#2);
ENDSEC;
END-ISO-10303-21;`;

    const { ast } = parseP21(p21);
    const model = new StepModel(SCHEMA);
    const { diagnostics } = loadEntities(ast.data, SCHEMA, model, true);

    expect(diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
    expect(model.size).toBe(3);

    const line = model.getInstance(asInstanceId(3));
    expect(line).toBeDefined();
    expect(line!.typeName).toBe('LINE');

    const pntRef = getAttribute(line!, 'pnt');
    expect(isInstanceRef(pntRef!)).toBe(true);
    expect((pntRef as { id: number }).id).toBe(1);
  });

  it('should handle forward references (#2 before #1)', () => {
    const p21 = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('LOADER_TEST'));
ENDSEC;
DATA;
#2=LINE('L1',#1,#3);
#1=POINT('P1',1.0,2.0,3.0);
#3=DIRECTION('D1',(0.0,1.0,0.0));
ENDSEC;
END-ISO-10303-21;`;

    const { ast } = parseP21(p21);
    const model = new StepModel(SCHEMA);
    const { diagnostics } = loadEntities(ast.data, SCHEMA, model, true);

    expect(diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
    expect(model.size).toBe(3);

    const line = model.getInstance(asInstanceId(2));
    const pntRef = getAttribute(line!, 'pnt');
    expect(isInstanceRef(pntRef!)).toBe(true);
    expect((pntRef as { id: number }).id).toBe(1);

    const dirRef = getAttribute(line!, 'dir');
    expect(isInstanceRef(dirRef!)).toBe(true);
    expect((dirRef as { id: number }).id).toBe(3);
  });

  it('should emit UNKNOWN_ENTITY for entities not in schema', () => {
    const p21 = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('LOADER_TEST'));
ENDSEC;
DATA;
#1=NONEXISTENT('test');
ENDSEC;
END-ISO-10303-21;`;

    const { ast } = parseP21(p21);
    const model = new StepModel(SCHEMA);
    const { diagnostics } = loadEntities(ast.data, SCHEMA, model, true);

    expect(diagnostics.some((d) => d.code === 'UNKNOWN_ENTITY')).toBe(true);
    expect(model.size).toBe(0);
  });

  it('should emit DUPLICATE_INSTANCE_ID for duplicate IDs', () => {
    const p21 = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('LOADER_TEST'));
ENDSEC;
DATA;
#1=POINT('P1',1.0,2.0,3.0);
#1=POINT('P2',4.0,5.0,6.0);
ENDSEC;
END-ISO-10303-21;`;

    const { ast } = parseP21(p21);
    const model = new StepModel(SCHEMA);
    const { diagnostics } = loadEntities(ast.data, SCHEMA, model, true);

    expect(diagnostics.some((d) => d.code === 'DUPLICATE_INSTANCE_ID')).toBe(
      true,
    );
    expect(model.size).toBe(1);
  });

  it('should emit DANGLING_ENTITY_REF for missing references', () => {
    const p21 = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('LOADER_TEST'));
ENDSEC;
DATA;
#1=LINE('L1',#99,#98);
ENDSEC;
END-ISO-10303-21;`;

    const { ast } = parseP21(p21);
    const model = new StepModel(SCHEMA);
    const { diagnostics } = loadEntities(ast.data, SCHEMA, model, true);

    const danglingDiags = diagnostics.filter(
      (d) => d.code === 'DANGLING_ENTITY_REF',
    );
    expect(danglingDiags.length).toBeGreaterThanOrEqual(2);
  });
});

describe('entity-loader (simple entities with derived redeclarations)', () => {
  it('should load oriented_edge with * in derived slot position', () => {
    const p21 = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('ORIENTED_TEST'));
ENDSEC;
DATA;
#1=ORIENTED_EDGE(*,42,.T.);
ENDSEC;
END-ISO-10303-21;`;

    const { ast } = parseP21(p21);
    const model = new StepModel(ORIENTED_EDGE_SCHEMA);
    const { diagnostics } = loadEntities(
      ast.data,
      ORIENTED_EDGE_SCHEMA,
      model,
      true,
    );

    expect(diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
    expect(model.size).toBe(1);

    const instance = model.getInstance(asInstanceId(1));
    expect(instance).toBeDefined();
    expect(instance!.typeName).toBe('ORIENTED_EDGE');
    expect(getAttribute(instance!, 'EDGE_END')).toBe(42);
    expect(getAttribute(instance!, 'ORIENTATION')).toBe(true);
    // EDGE_START is derived, should not be in attributes
    expect(instance!.attributes.has('EDGE_START')).toBe(false);
  });

  it('should not change mapping for entities without redeclarations', () => {
    const p21 = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('LOADER_TEST'));
ENDSEC;
DATA;
#1=POINT('Origin',0.0,0.0,0.0);
ENDSEC;
END-ISO-10303-21;`;

    const { ast } = parseP21(p21);
    const model = new StepModel(SCHEMA);
    const { diagnostics } = loadEntities(ast.data, SCHEMA, model, true);

    expect(diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
    expect(getAttribute(model.getInstance(asInstanceId(1))!, 'x')).toBe(0.0);
  });
});
