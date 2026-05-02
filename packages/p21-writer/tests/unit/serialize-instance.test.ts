import type { ExpressSchema } from '@step-nc/express-dictionary';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import {
  INDETERMINATE,
  StepModel,
  createList,
  createRef,
  createSelectValue,
  createSet,
  setAttribute,
} from '@step-nc/step-factory';
import { describe, expect, it } from 'vitest';
import {
  getEntityComponents,
  isComplexEntity,
  serializeInstance,
} from '../../src/serialize-instance';

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

describe('serializeInstance', () => {
  describe('simple entities', () => {
    const SIMPLE_SCHEMA_SOURCE = `
      SCHEMA TEST_SIMPLE;
        TYPE length_measure = REAL;
        END_TYPE;

        TYPE label = STRING;
        END_TYPE;

        TYPE axis_type = ENUMERATION OF (axis2_2d, axis2_3d);
        END_TYPE;

        TYPE geometric_select = SELECT (point, direction);
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
          pnt : OPTIONAL point;
          dir : direction;
        END_ENTITY;

        ENTITY dummy;
        END_ENTITY;

        ENTITY geometric_set SUBTYPE OF (representation_item);
          elements : SET [1:?] OF geometric_select;
        END_ENTITY;

        ENTITY axis_config SUBTYPE OF (representation_item);
          axis : axis_type;
        END_ENTITY;

      END_SCHEMA;
    `;

    function setupSimple() {
      const schema = buildSchemaFromSource(SIMPLE_SCHEMA_SOURCE);
      const model = new StepModel(schema);
      return { schema, model };
    }

    it('should serialize instance with 3 REAL attributes', () => {
      const { schema, model } = setupSimple();
      const { instance } = model.createInstance('point');
      setAttribute(instance!, 'name', 'P1');
      setAttribute(instance!, 'x', 1.0, schema);
      setAttribute(instance!, 'y', 2.0, schema);
      setAttribute(instance!, 'z', 3.0, schema);

      const { text, diagnostics } = serializeInstance(instance!, schema);
      expect(diagnostics).toHaveLength(0);
      expect(text).toBe("#1=POINT('P1',1.,2.,3.);");
    });

    it('should serialize instance with null attribute as $', () => {
      const { schema, model } = setupSimple();
      const { instance: dir } = model.createInstance('direction');
      setAttribute(dir!, 'name', 'D1');
      setAttribute(
        dir!,
        'direction_ratios',
        createList([1.0, 0.0, 0.0]),
        schema,
      );

      const { instance: line } = model.createInstance('line');
      setAttribute(line!, 'name', 'L1');
      setAttribute(line!, 'dir', createRef(dir!.id, 'DIRECTION'), schema);

      const { text } = serializeInstance(line!, schema);
      expect(text).toBe("#2=LINE('L1',$,#1);");
    });

    it('should serialize instance with inherited attributes in correct order', () => {
      const { schema, model } = setupSimple();
      const { instance } = model.createInstance('point');
      setAttribute(instance!, 'name', 'Origin');
      setAttribute(instance!, 'x', 0.0, schema);
      setAttribute(instance!, 'y', 0.0, schema);
      setAttribute(instance!, 'z', 0.0, schema);

      const { text } = serializeInstance(instance!, schema);
      // name (from representation_item) comes first, then x, y, z
      expect(text).toBe("#1=POINT('Origin',0.,0.,0.);");
    });

    it('should serialize instance with enumeration', () => {
      const { schema, model } = setupSimple();
      const { instance } = model.createInstance('axis_config');
      setAttribute(instance!, 'name', 'A1');
      setAttribute(instance!, 'axis', 'axis2_3d', schema);

      const { text } = serializeInstance(instance!, schema);
      expect(text).toBe("#1=AXIS_CONFIG('A1',.AXIS2_3D.);");
    });

    it('should serialize instance with aggregation of refs', () => {
      const { schema, model } = setupSimple();
      const { instance: pt } = model.createInstance('point');
      setAttribute(pt!, 'name', 'P1');
      setAttribute(pt!, 'x', 1.0, schema);
      setAttribute(pt!, 'y', 2.0, schema);
      setAttribute(pt!, 'z', 3.0, schema);

      const { instance: dir } = model.createInstance('direction');
      setAttribute(dir!, 'name', 'D1');
      setAttribute(dir!, 'direction_ratios', createList([1.0, 0.0]), schema);

      const { instance: geoSet } = model.createInstance('geometric_set');
      setAttribute(geoSet!, 'name', 'GS1');
      setAttribute(
        geoSet!,
        'elements',
        createSet([
          createSelectValue(
            ['GEOMETRIC_SELECT', 'POINT'],
            createRef(pt!.id, 'POINT'),
          ),
          createSelectValue(
            ['GEOMETRIC_SELECT', 'DIRECTION'],
            createRef(dir!.id, 'DIRECTION'),
          ),
        ]),
        schema,
      );

      const { text } = serializeInstance(geoSet!, schema);
      expect(text).toBe("#3=GEOMETRIC_SET('GS1',(POINT(#1),DIRECTION(#2)));");
    });

    it('should serialize instance without attributes', () => {
      const { schema, model } = setupSimple();
      const { instance } = model.createInstance('dummy');

      const { text } = serializeInstance(instance!, schema);
      expect(text).toBe('#1=DUMMY();');
    });

    it('should serialize all unset attributes as $', () => {
      const { schema, model } = setupSimple();
      const { instance } = model.createInstance('point');

      const { text } = serializeInstance(instance!, schema);
      expect(text).toBe('#1=POINT($,$,$,$);');
    });
  });

  describe('DERIVED attributes', () => {
    const DERIVED_SCHEMA_SOURCE = `
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

    it('should NOT emit * for native DERIVED attributes (non-redeclaring)', () => {
      const schema = buildSchemaFromSource(DERIVED_SCHEMA_SOURCE);
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
      setAttribute(vec!, 'magnitude', 5.0, schema);

      const { text } = serializeInstance(vec!, schema);
      // dim is native DERIVED (not redeclaring an explicit) — no * in P21
      expect(text).toBe('#2=VECTOR(#1,5.);');
    });
  });

  describe('DERIVE redeclarations (oriented_edge)', () => {
    const REDECLARE_SCHEMA_SOURCE = `
      SCHEMA TEST_REDECLARE;
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
    `;

    const SIMPLE_POINT_SCHEMA = `
      SCHEMA TEST_SIMPLE;
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
      END_SCHEMA;
    `;

    it('should emit * in correct position for redeclared derived attribute', () => {
      const schema = buildSchemaFromSource(REDECLARE_SCHEMA_SOURCE);
      const model = new StepModel(schema);

      const { instance } = model.createInstance('oriented_edge');
      setAttribute(instance!, 'edge_end', 42, schema);
      setAttribute(instance!, 'orientation', true, schema);

      const { text, diagnostics } = serializeInstance(instance!, schema);
      expect(diagnostics).toHaveLength(0);
      expect(text).toBe('#1=ORIENTED_EDGE(*,42,.T.);');
    });

    it('should not change output for entities without redeclarations', () => {
      const schema = buildSchemaFromSource(SIMPLE_POINT_SCHEMA);
      const model = new StepModel(schema);
      const { instance } = model.createInstance('point');
      setAttribute(instance!, 'name', 'P1');
      setAttribute(instance!, 'x', 1.0, schema);
      setAttribute(instance!, 'y', 2.0, schema);
      setAttribute(instance!, 'z', 3.0, schema);

      const { text } = serializeInstance(instance!, schema);
      expect(text).toBe("#1=POINT('P1',1.,2.,3.);");
    });
  });

  describe('complex entities', () => {
    const COMPLEX_SCHEMA_SOURCE = `
      SCHEMA TEST_COMPLEX;
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

        ENTITY length_si_unit SUBTYPE OF (si_unit, length_unit);
        END_ENTITY;

        ENTITY representation_context;
          context_identifier : STRING;
          context_type : STRING;
        END_ENTITY;

        ENTITY geometric_representation_context SUBTYPE OF (representation_context);
          coordinate_space_dimension : INTEGER;
        END_ENTITY;

        ENTITY global_unit_assigned_context SUBTYPE OF (representation_context);
          units : LIST [1:?] OF INTEGER;
        END_ENTITY;

        ENTITY geo_global_context SUBTYPE OF (geometric_representation_context, global_unit_assigned_context);
        END_ENTITY;

      END_SCHEMA;
    `;

    function setupComplex() {
      const schema = buildSchemaFromSource(COMPLEX_SCHEMA_SOURCE);
      const model = new StepModel(schema);
      return { schema, model };
    }

    it('should detect simple entity as non-complex', () => {
      const { schema } = setupComplex();
      const namedUnit = schema.entities.get('NAMED_UNIT')!;
      expect(isComplexEntity(namedUnit)).toBe(false);
    });

    it('should detect entity with multiple supertypes as complex', () => {
      const { schema } = setupComplex();
      const lengthSiUnit = schema.entities.get('LENGTH_SI_UNIT')!;
      expect(isComplexEntity(lengthSiUnit)).toBe(true);
    });

    it('should get entity components sorted alphabetically', () => {
      const { schema } = setupComplex();
      const lengthSiUnit = schema.entities.get('LENGTH_SI_UNIT')!;
      const components = getEntityComponents(lengthSiUnit);

      const names = components.map((c) => c.definition.name.toUpperCase());
      expect(names).toEqual([
        'LENGTH_SI_UNIT',
        'LENGTH_UNIT',
        'NAMED_UNIT',
        'SI_UNIT',
      ]);
    });

    it('should serialize complex entity with correct format', () => {
      const { schema, model } = setupComplex();
      const { instance } = model.createInstance('length_si_unit');
      setAttribute(instance!, 'dimensions', INDETERMINATE);
      setAttribute(instance!, 'prefix', 'milli', schema);
      setAttribute(instance!, 'unit_name', 'metre', schema);

      const { text, diagnostics } = serializeInstance(instance!, schema);
      expect(diagnostics).toHaveLength(0);
      // Components: LENGTH_SI_UNIT() LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.)
      expect(text).toBe(
        '#1=(LENGTH_SI_UNIT() LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.));',
      );
    });

    it('should serialize complex entity with 2 supertypes', () => {
      const { schema, model } = setupComplex();
      const { instance } = model.createInstance('geo_global_context');
      setAttribute(instance!, 'context_identifier', 'ID1');
      setAttribute(instance!, 'context_type', '3D');
      setAttribute(instance!, 'coordinate_space_dimension', 3, schema);
      setAttribute(instance!, 'units', createList([1, 2, 3]), schema);

      const { text } = serializeInstance(instance!, schema);
      // Components alphabetically: GEO_GLOBAL_CONTEXT, GEOMETRIC_REPRESENTATION_CONTEXT, GLOBAL_UNIT_ASSIGNED_CONTEXT, REPRESENTATION_CONTEXT
      expect(text).toBe(
        "#1=(GEO_GLOBAL_CONTEXT() GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNIT_ASSIGNED_CONTEXT((1,2,3)) REPRESENTATION_CONTEXT('ID1','3D'));",
      );
    });

    it('should include components with 0 own attributes', () => {
      const { schema, model } = setupComplex();
      const { instance } = model.createInstance('length_si_unit');
      setAttribute(instance!, 'dimensions', INDETERMINATE);
      setAttribute(instance!, 'prefix', null, schema);
      setAttribute(instance!, 'unit_name', 'metre', schema);

      const { text } = serializeInstance(instance!, schema);
      // LENGTH_SI_UNIT() and LENGTH_UNIT() have no own explicit attributes
      expect(text).toContain('LENGTH_SI_UNIT()');
      expect(text).toContain('LENGTH_UNIT()');
    });
  });
});
