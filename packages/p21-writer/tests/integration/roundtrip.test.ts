import type { ExpressSchema } from '@step-nc/express-dictionary';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import {
  createList,
  createRef,
  createSelectValue,
  INDETERMINATE,
  setAttribute,
  StepModel,
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

describe('Integration: roundtrip snapshot tests', () => {
  describe('basic geometry', () => {
    const GEOMETRY_SCHEMA = `
      SCHEMA TEST_GEOM;
        TYPE length_measure = REAL;
        END_TYPE;
        TYPE label = STRING;
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
      END_SCHEMA;
    `;

    it('should serialize geometry model with cross-references', () => {
      const schema = buildSchemaFromSource(GEOMETRY_SCHEMA);
      const model = new StepModel(schema);

      const { instance: pt1 } = model.createInstance('point');
      setAttribute(pt1!, 'name', 'Origin');
      setAttribute(pt1!, 'x', 0.0, schema);
      setAttribute(pt1!, 'y', 0.0, schema);
      setAttribute(pt1!, 'z', 0.0, schema);

      const { instance: pt2 } = model.createInstance('point');
      setAttribute(pt2!, 'name', 'End');
      setAttribute(pt2!, 'x', 10.0, schema);
      setAttribute(pt2!, 'y', 0.0, schema);
      setAttribute(pt2!, 'z', 0.0, schema);

      const { instance: dir } = model.createInstance('direction');
      setAttribute(dir!, 'name', 'X-axis');
      setAttribute(
        dir!,
        'direction_ratios',
        createList([1.0, 0.0, 0.0]),
        schema,
      );

      const { instance: line } = model.createInstance('line');
      setAttribute(line!, 'name', 'MyLine');
      setAttribute(line!, 'pnt', createRef(pt1!.id, 'POINT'), schema);
      setAttribute(line!, 'dir', createRef(dir!.id, 'DIRECTION'), schema);

      const { content } = writeP21(model, {
        header: {
          timestamp: '2025-01-01T00:00:00',
          fileName: 'test-geometry.stp',
        },
      });

      expect(content).toMatchSnapshot();
    });
  });

  describe('enumerations', () => {
    const ENUM_SCHEMA = `
      SCHEMA TEST_ENUM;
        TYPE direction_type = ENUMERATION OF (forward, backward, left, right);
        END_TYPE;

        ENTITY movement;
          direction : direction_type;
          distance  : REAL;
        END_ENTITY;
      END_SCHEMA;
    `;

    it('should serialize enumeration values', () => {
      const schema = buildSchemaFromSource(ENUM_SCHEMA);
      const model = new StepModel(schema);

      const { instance } = model.createInstance('movement');
      setAttribute(instance!, 'direction', 'forward', schema);
      setAttribute(instance!, 'distance', 5.0, schema);

      const { content } = writeP21(model, {
        header: { timestamp: '2025-01-01T00:00:00' },
      });

      expect(content).toMatchSnapshot();
    });
  });

  describe('aggregations', () => {
    const AGG_SCHEMA = `
      SCHEMA TEST_AGG;
        ENTITY polygon;
          points : LIST [3:?] OF REAL;
        END_ENTITY;
      END_SCHEMA;
    `;

    it('should serialize aggregation attributes', () => {
      const schema = buildSchemaFromSource(AGG_SCHEMA);
      const model = new StepModel(schema);

      const { instance } = model.createInstance('polygon');
      setAttribute(
        instance!,
        'points',
        createList([1.0, 2.0, 3.0, 4.0, 5.0, 6.0]),
        schema,
      );

      const { content } = writeP21(model, {
        header: { timestamp: '2025-01-01T00:00:00' },
      });

      expect(content).toMatchSnapshot();
    });
  });

  describe('SELECT types', () => {
    const SELECT_SCHEMA = `
      SCHEMA TEST_SELECT;
        TYPE geometric_select = SELECT (point, direction);
        END_TYPE;

        ENTITY point;
          x : REAL;
          y : REAL;
        END_ENTITY;

        ENTITY direction;
          dx : REAL;
          dy : REAL;
        END_ENTITY;

        ENTITY container;
          item : geometric_select;
        END_ENTITY;
      END_SCHEMA;
    `;

    it('should serialize SELECT values', () => {
      const schema = buildSchemaFromSource(SELECT_SCHEMA);
      const model = new StepModel(schema);

      const { instance: pt } = model.createInstance('point');
      setAttribute(pt!, 'x', 1.0, schema);
      setAttribute(pt!, 'y', 2.0, schema);

      const { instance: container } = model.createInstance('container');
      setAttribute(
        container!,
        'item',
        createSelectValue(
          ['GEOMETRIC_SELECT', 'POINT'],
          createRef(pt!.id, 'POINT'),
        ),
        schema,
      );

      const { content } = writeP21(model, {
        header: { timestamp: '2025-01-01T00:00:00' },
      });

      expect(content).toMatchSnapshot();
    });
  });

  describe('complex entities', () => {
    const COMPLEX_SCHEMA = `
      SCHEMA TEST_COMPLEX;
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
    `;

    it('should serialize complex entity instances', () => {
      const schema = buildSchemaFromSource(COMPLEX_SCHEMA);
      const model = new StepModel(schema);

      const { instance } = model.createInstance('length_si_unit');
      setAttribute(instance!, 'dimensions', INDETERMINATE);
      setAttribute(instance!, 'prefix', 'milli', schema);
      setAttribute(instance!, 'unit_name', 'metre', schema);

      const { content } = writeP21(model, {
        header: { timestamp: '2025-01-01T00:00:00' },
      });

      expect(content).toMatchSnapshot();
    });
  });

  describe('optional and DERIVED attributes', () => {
    const DERIVED_SCHEMA = `
      SCHEMA TEST_DERIVED;
        ENTITY direction;
          direction_ratios : LIST [2:3] OF REAL;
        END_ENTITY;

        ENTITY vector;
          orientation : direction;
          magnitude   : REAL;
        DERIVE
          dim : INTEGER := SIZEOF(orientation.direction_ratios);
        END_ENTITY;
      END_SCHEMA;
    `;

    it('should serialize mix of $, values, and * in single instance', () => {
      const schema = buildSchemaFromSource(DERIVED_SCHEMA);
      const model = new StepModel(schema);

      const { instance: dir } = model.createInstance('direction');
      setAttribute(
        dir!,
        'direction_ratios',
        createList([1.0, 0.0, 0.0]),
        schema,
      );

      const { instance: vec } = model.createInstance('vector');
      setAttribute(
        vec!,
        'orientation',
        createRef(dir!.id, 'DIRECTION'),
        schema,
      );
      setAttribute(vec!, 'magnitude', 10.0, schema);

      const { content } = writeP21(model, {
        header: { timestamp: '2025-01-01T00:00:00' },
      });

      expect(content).toMatchSnapshot();
    });
  });

  describe('empty model', () => {
    it('should produce valid P21 with only header and empty data section', () => {
      const schema = buildSchemaFromSource(`
        SCHEMA EMPTY_TEST;
          ENTITY dummy;
          END_ENTITY;
        END_SCHEMA;
      `);
      const model = new StepModel(schema);

      const { content } = writeP21(model, {
        header: { timestamp: '2025-01-01T00:00:00' },
      });

      expect(content).toMatchSnapshot();
    });
  });

  describe('large model coherence', () => {
    it('should handle 1000+ instances without issues', () => {
      const schema = buildSchemaFromSource(`
        SCHEMA PERF_TEST;
          ENTITY item;
            val : REAL;
          END_ENTITY;
        END_SCHEMA;
      `);
      const model = new StepModel(schema);

      for (let i = 0; i < 1000; i++) {
        const { instance } = model.createInstance('item');
        setAttribute(instance!, 'val', i * 1.5, schema);
      }

      const { content, diagnostics } = writeP21(model);
      expect(diagnostics).toHaveLength(0);
      expect(content).toContain('#1=ITEM(');
      expect(content).toContain('#1000=ITEM(');

      const dataSection = content.split('DATA;\n')[1]!.split('\nENDSEC;')[0]!;
      const lines = dataSection.split('\n').filter((l) => l.startsWith('#'));
      expect(lines).toHaveLength(1000);
    });
  });

  describe('roundtrip coherence', () => {
    it('should include every instance from model in output', () => {
      const schema = buildSchemaFromSource(`
        SCHEMA ROUNDTRIP;
          ENTITY point;
            x : REAL;
            y : REAL;
          END_ENTITY;
        END_SCHEMA;
      `);
      const model = new StepModel(schema);

      for (let i = 0; i < 50; i++) {
        const { instance } = model.createInstance('point');
        setAttribute(instance!, 'x', i * 1.0, schema);
        setAttribute(instance!, 'y', i * 2.0, schema);
      }

      const content = writeP21ToString(model);

      const allInstances = model.getAllInstances();
      for (const inst of allInstances) {
        expect(content).toContain(`#${inst.id}=POINT(`);
      }
    });
  });
});
