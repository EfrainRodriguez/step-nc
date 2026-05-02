import type { ExpressSchema } from '@step-nc/express-dictionary';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  asInstanceId,
  getAttribute,
  setAttribute,
  StepModel,
} from '@step-nc/step-factory';
import { describe, expect, it } from 'vitest';
import { readP21 } from '../../src/read-p21';
import { writeP21ToString } from '@step-nc/p21-writer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_GEOMETRY_EXP = resolve(
  __dirname,
  '../../../step-factory/tests/fixtures/test-geometry.exp',
);

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

describe('roundtrip with derived redeclarations', () => {
  it('should roundtrip oriented_edge with redeclared SELF\\edge.edge_start', () => {
    const source = readFileSync(TEST_GEOMETRY_EXP, 'utf-8');
    const schema = buildSchemaFromSource(source);

    const model = new StepModel(schema);
    const { instance } = model.createInstance('oriented_edge');
    setAttribute(instance!, 'edge_end', 42, schema);
    setAttribute(instance!, 'orientation', true, schema);

    const p21Out = writeP21ToString(model);
    const { model: readModel, diagnostics } = readP21(p21Out, schema);

    expect(diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);

    const readInstance = readModel.getInstance(asInstanceId(1));
    expect(readInstance).toBeDefined();
    expect(getAttribute(readInstance!, 'EDGE_END')).toBe(42);
    expect(getAttribute(readInstance!, 'ORIENTATION')).toBe(true);
    expect(readInstance!.attributes.has('EDGE_START')).toBe(false);
  });

  it('should roundtrip edge (no redeclarations) unchanged', () => {
    const source = readFileSync(TEST_GEOMETRY_EXP, 'utf-8');
    const schema = buildSchemaFromSource(source);

    const model = new StepModel(schema);
    const { instance } = model.createInstance('edge');
    setAttribute(instance!, 'edge_start', 10, schema);
    setAttribute(instance!, 'edge_end', 20, schema);

    const p21Out = writeP21ToString(model);
    const { model: readModel, diagnostics } = readP21(p21Out, schema);

    expect(diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);

    const readInstance = readModel.getInstance(asInstanceId(1));
    expect(getAttribute(readInstance!, 'EDGE_START')).toBe(10);
    expect(getAttribute(readInstance!, 'EDGE_END')).toBe(20);
  });

  it('should reject abstract entity instance on read', () => {
    const source = readFileSync(TEST_GEOMETRY_EXP, 'utf-8');
    const schema = buildSchemaFromSource(source);

    const p21 = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((),'2;1');
FILE_NAME('test','2025-01-01',(''),(''),'','','');
FILE_SCHEMA(('TEST_GEOMETRY'));
ENDSEC;
DATA;
#1=SHAPE_ITEM('test');
ENDSEC;
END-ISO-10303-21;`;

    const { diagnostics } = readP21(p21, schema);

    const abstractDiags = diagnostics.filter(
      (d) => d.code === 'ABSTRACT_ENTITY',
    );
    expect(abstractDiags.length).toBeGreaterThanOrEqual(1);
  });
});
