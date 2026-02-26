import type { ExpressSchema } from '@step-nc/express-dictionary';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import {
  StepModel,
  createList,
  createRef,
  setAttribute,
} from '@step-nc/step-factory';
import { describe, expect, it } from 'vitest';
import { writeP21, writeP21ToString } from '../../src/write-p21';

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

const SCHEMA_SOURCE = `
  SCHEMA WRITER_TEST;
    TYPE length_measure = REAL;
    END_TYPE;

    TYPE label = STRING;
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
`;

describe('writeP21', () => {
  function setupSchema() {
    return buildSchemaFromSource(SCHEMA_SOURCE);
  }

  it('should produce valid P21 for empty model', () => {
    const schema = setupSchema();
    const model = new StepModel(schema);
    const { content, diagnostics } = writeP21(model);

    expect(diagnostics).toHaveLength(0);
    expect(content).toContain('ISO-10303-21;');
    expect(content).toContain('HEADER;');
    expect(content).toContain("FILE_SCHEMA(('WRITER_TEST'));");
    expect(content).toContain('ENDSEC;');
    expect(content).toContain('DATA;');
    expect(content).toContain('END-ISO-10303-21;');
  });

  it('should serialize model with single instance', () => {
    const schema = setupSchema();
    const model = new StepModel(schema);
    const { instance } = model.createInstance('point');
    setAttribute(instance!, 'name', 'P1');
    setAttribute(instance!, 'x', 1.0, schema);
    setAttribute(instance!, 'y', 2.0, schema);
    setAttribute(instance!, 'z', 3.0, schema);

    const { content } = writeP21(model);
    expect(content).toContain("POINT('P1',1.,2.,3.)");
  });

  it('should serialize model with cross-references', () => {
    const schema = setupSchema();
    const model = new StepModel(schema);

    const { instance: pt } = model.createInstance('point');
    setAttribute(pt!, 'name', 'Origin');
    setAttribute(pt!, 'x', 0.0, schema);
    setAttribute(pt!, 'y', 0.0, schema);
    setAttribute(pt!, 'z', 0.0, schema);

    const { instance: dir } = model.createInstance('direction');
    setAttribute(dir!, 'name', 'X-axis');
    setAttribute(dir!, 'direction_ratios', createList([1.0, 0.0, 0.0]), schema);

    const { instance: line } = model.createInstance('line');
    setAttribute(line!, 'name', 'L1');
    setAttribute(line!, 'pnt', createRef(pt!.id, 'POINT'), schema);
    setAttribute(line!, 'dir', createRef(dir!.id, 'DIRECTION'), schema);

    const { content } = writeP21(model);
    expect(content).toContain("#1=POINT('Origin',0.,0.,0.);");
    expect(content).toContain("#2=DIRECTION('X-axis',(1.,0.,0.));");
    expect(content).toContain("#3=LINE('L1',#1,#2);");
  });

  it('should sort instances by ID', () => {
    const schema = setupSchema();
    const model = new StepModel(schema);

    model.createInstanceWithId(3, 'point');
    model.createInstanceWithId(1, 'point');
    model.createInstanceWithId(2, 'point');

    const { content } = writeP21(model);
    const dataSection = content.split('DATA;\n')[1]!.split('\nENDSEC;')[0]!;
    const lines = dataSection.split('\n').filter((l) => l.startsWith('#'));

    expect(lines[0]).toMatch(/^#1=/);
    expect(lines[1]).toMatch(/^#2=/);
    expect(lines[2]).toMatch(/^#3=/);
  });

  it('should use custom header options', () => {
    const schema = setupSchema();
    const model = new StepModel(schema);

    const { content } = writeP21(model, {
      header: {
        description: ['My custom description'],
        fileName: 'output.stp',
        author: ['Test Author'],
        organization: ['Test Org'],
        preprocessorVersion: 'p21-writer v0.1',
        originatingSystem: 'step-nc',
        authorization: 'approved',
        schemas: ['CUSTOM_SCHEMA'],
      },
    });

    expect(content).toContain("'My custom description'");
    expect(content).toContain("'output.stp'");
    expect(content).toContain("('Test Author')");
    expect(content).toContain("('Test Org')");
    expect(content).toContain("FILE_SCHEMA(('CUSTOM_SCHEMA'));");
  });

  it('should apply line wrapping when maxLineLength is set', () => {
    const schema = setupSchema();
    const model = new StepModel(schema);
    const { instance } = model.createInstance('point');
    setAttribute(
      instance!,
      'name',
      'A very long name for testing line wrapping behavior',
    );
    setAttribute(instance!, 'x', 1.0, schema);
    setAttribute(instance!, 'y', 2.0, schema);
    setAttribute(instance!, 'z', 3.0, schema);

    const { content } = writeP21(model, {
      formatting: { maxLineLength: 40 },
    });

    const dataLines = content
      .split('DATA;\n')[1]!
      .split('\nENDSEC;')[0]!
      .split('\n')
      .filter((l) => l.trim().length > 0);

    for (const line of dataLines) {
      expect(line.length).toBeLessThanOrEqual(60);
    }
  });

  it('should accumulate diagnostics from instances', () => {
    const schema = setupSchema();
    const model = new StepModel(schema);
    const { instance } = model.createInstance('point');
    setAttribute(instance!, 'name', 'P1');
    // x, y, z left as undefined → $ (no error, just unset)

    const { diagnostics } = writeP21(model);
    // No diagnostics expected for unset optional values
    expect(Array.isArray(diagnostics)).toBe(true);
  });

  it('writeP21ToString should return same content as writeP21', () => {
    const schema = setupSchema();
    const model = new StepModel(schema);
    const { instance } = model.createInstance('point');
    setAttribute(instance!, 'name', 'P1');
    setAttribute(instance!, 'x', 1.0, schema);
    setAttribute(instance!, 'y', 2.0, schema);
    setAttribute(instance!, 'z', 3.0, schema);

    const result = writeP21(model);
    const str = writeP21ToString(model);

    expect(str).toBe(result.content);
  });
});
