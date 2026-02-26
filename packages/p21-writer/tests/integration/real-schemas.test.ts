import type { ExpressSchema } from '@step-nc/express-dictionary';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { INDETERMINATE, setAttribute, StepModel } from '@step-nc/step-factory';
import { describe, expect, it } from 'vitest';
import { writeP21 } from '../../src/write-p21';

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

describe('Integration: real-world P21 pattern compatibility', () => {
  describe('P21 envelope structure', () => {
    it('should produce ISO-10303-21 envelope with correct markers', () => {
      const schema = buildSchemaFromSource(`
        SCHEMA ENVELOPE_TEST;
          ENTITY item;
            val : REAL;
          END_ENTITY;
        END_SCHEMA;
      `);
      const model = new StepModel(schema);
      const { instance } = model.createInstance('item');
      setAttribute(instance!, 'val', 42.0, schema);

      const { content } = writeP21(model);

      expect(content.startsWith('ISO-10303-21;\n')).toBe(true);
      expect(content).toContain('HEADER;');
      expect(content).toContain('FILE_DESCRIPTION(');
      expect(content).toContain('FILE_NAME(');
      expect(content).toContain('FILE_SCHEMA(');
      expect(content).toContain('DATA;');
      expect(content).toContain('ENDSEC;');
      expect(content.trimEnd().endsWith('END-ISO-10303-21;')).toBe(true);
    });
  });

  describe('complex entity format matches reference files', () => {
    const UNIT_SCHEMA = `
      SCHEMA UNIT_TEST;
        TYPE si_prefix = ENUMERATION OF (milli, centi, kilo, mega);
        END_TYPE;
        TYPE si_unit_name = ENUMERATION OF (metre, kilogram, second, radian, steradian);
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

        ENTITY plane_angle_unit SUBTYPE OF (named_unit);
        END_ENTITY;

        ENTITY solid_angle_unit SUBTYPE OF (named_unit);
        END_ENTITY;

        ENTITY length_si SUBTYPE OF (length_unit, si_unit);
        END_ENTITY;

        ENTITY angle_si SUBTYPE OF (plane_angle_unit, si_unit);
        END_ENTITY;

        ENTITY solid_si SUBTYPE OF (solid_angle_unit, si_unit);
        END_ENTITY;
      END_SCHEMA;
    `;

    it('should produce complex entity format similar to geometry_out_stp.p21 #656', () => {
      const schema = buildSchemaFromSource(UNIT_SCHEMA);
      const model = new StepModel(schema);

      // Mimics #656=(LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.))
      const { instance } = model.createInstance('length_si');
      setAttribute(instance!, 'dimensions', INDETERMINATE);
      setAttribute(instance!, 'prefix', 'milli', schema);
      setAttribute(instance!, 'unit_name', 'metre', schema);

      const { content } = writeP21(model, {
        header: { timestamp: '2025-01-01T00:00:00' },
      });

      // Verify complex entity format
      expect(content).toMatch(/#\d+=\(/);
      expect(content).toContain('LENGTH_SI(');
      expect(content).toContain('LENGTH_UNIT(');
      expect(content).toContain('NAMED_UNIT(');
      expect(content).toContain('SI_UNIT(');
      expect(content).toContain('.MILLI.');
      expect(content).toContain('.METRE.');
    });

    it('should produce complex entity for solid angle unit similar to #661', () => {
      const schema = buildSchemaFromSource(UNIT_SCHEMA);
      const model = new StepModel(schema);

      // Mimics #661=(NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT())
      const { instance } = model.createInstance('solid_si');
      setAttribute(instance!, 'dimensions', INDETERMINATE);
      setAttribute(instance!, 'prefix', null, schema);
      setAttribute(instance!, 'unit_name', 'steradian', schema);

      const { content } = writeP21(model, {
        header: { timestamp: '2025-01-01T00:00:00' },
      });

      expect(content).toContain('NAMED_UNIT(*)');
      expect(content).toContain('SI_UNIT($,.STERADIAN.)');
      expect(content).toContain('SOLID_ANGLE_UNIT()');
      expect(content).toContain('SOLID_SI()');
    });
  });

  describe('FILE_SCHEMA with version ID', () => {
    it('should support schema with version identifier like AUTOMOTIVE_DESIGN', () => {
      const schema = buildSchemaFromSource(`
        SCHEMA AUTO_DESIGN;
          ENTITY dummy;
          END_ENTITY;
        END_SCHEMA;
      `);
      const model = new StepModel(schema);

      const { content } = writeP21(model, {
        header: {
          schemas: ['AUTOMOTIVE_DESIGN { 1 0 10303 214 2 1 1}'],
          timestamp: '2025-01-01T00:00:00',
        },
      });

      expect(content).toContain(
        "FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 2 1 1}'));",
      );
    });
  });
});
