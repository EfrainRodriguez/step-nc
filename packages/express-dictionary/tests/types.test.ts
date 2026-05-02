import { describe, expect, it } from 'vitest';
import type {
  AggregationTypeDescriptor,
  EntityDefinition,
  ExplicitAttribute,
  ExpressSchema,
  SimpleTypeDescriptor,
  TypeDefinition,
  TypeDescriptor,
} from '../src/types';

describe('Semantic model types', () => {
  it('should allow creating an empty ExpressSchema', () => {
    const schema: ExpressSchema = {
      name: 'test_schema',
      entities: new Map(),
      types: new Map(),
      functions: new Map(),
      procedures: new Map(),
      rules: new Map(),
      constants: new Map(),
      subtypeConstraints: new Map(),
      interfaces: [],
      diagnostics: [],
    };

    expect(schema.name).toBe('test_schema');
    expect(schema.entities.size).toBe(0);
  });

  it('should allow creating an EntityDefinition with explicit attributes', () => {
    const schema: ExpressSchema = {
      name: 'test',
      entities: new Map(),
      types: new Map(),
      functions: new Map(),
      procedures: new Map(),
      rules: new Map(),
      constants: new Map(),
      subtypeConstraints: new Map(),
      interfaces: [],
      diagnostics: [],
    };

    const realType: SimpleTypeDescriptor = {
      kind: 'simple',
      simpleType: 'REAL',
    };

    const entity: EntityDefinition = {
      name: 'point',
      schema,
      abstract: true,
      supertypeNames: [],
      supertypes: [],
      subtypes: [],
      explicitAttributes: [],
      derivedAttributes: [],
      inverseAttributes: [],
      uniqueRules: [],
      whereRules: [],
      instantiable: false,
    };

    const attr: ExplicitAttribute = {
      name: 'x',
      parentEntity: entity,
      type: realType,
      optional: false,
    };

    entity.explicitAttributes.push(attr);
    schema.entities.set('POINT', entity);

    expect(schema.entities.get('POINT')).toBe(entity);
    expect(entity.explicitAttributes).toHaveLength(1);
    expect(entity.explicitAttributes[0]!.name).toBe('x');
    expect(entity.explicitAttributes[0]!.parentEntity).toBe(entity);
  });

  it('should support TypeDescriptor discriminated union', () => {
    const descriptors: TypeDescriptor[] = [
      { kind: 'simple', simpleType: 'INTEGER' },
      {
        kind: 'aggregation',
        aggregationKind: 'LIST',
        elementType: { kind: 'simple', simpleType: 'REAL' },
      },
      {
        kind: 'enumeration',
        values: ['RED', 'GREEN', 'BLUE'],
        extensible: false,
      },
      { kind: 'select', selections: [{ name: 'point' }], extensible: false },
      { kind: 'entity', entity: { name: 'point' } },
      { kind: 'defined', definition: { name: 'length_measure' } },
      { kind: 'generic' },
      { kind: 'genericEntity' },
    ];

    for (const desc of descriptors) {
      switch (desc.kind) {
        case 'simple':
          expect(desc.simpleType).toBeDefined();
          break;
        case 'aggregation':
          expect(desc.aggregationKind).toBeDefined();
          expect(desc.elementType).toBeDefined();
          break;
        case 'enumeration':
          expect(desc.values.length).toBeGreaterThan(0);
          break;
        case 'select':
          expect(desc.selections.length).toBeGreaterThan(0);
          break;
        case 'entity':
          expect(desc.entity.name).toBe('point');
          break;
        case 'defined':
          expect(desc.definition.name).toBe('length_measure');
          break;
        case 'generic':
        case 'genericEntity':
          break;
      }
    }

    expect(descriptors).toHaveLength(8);
  });

  it('should support back-references between schema, entity, and attributes', () => {
    const schema: ExpressSchema = {
      name: 'geometry',
      entities: new Map(),
      types: new Map(),
      functions: new Map(),
      procedures: new Map(),
      rules: new Map(),
      constants: new Map(),
      subtypeConstraints: new Map(),
      interfaces: [],
      diagnostics: [],
    };

    const entity: EntityDefinition = {
      name: 'point',
      schema,
      abstract: false,
      supertypeNames: [],
      supertypes: [],
      subtypes: [],
      explicitAttributes: [],
      derivedAttributes: [],
      inverseAttributes: [],
      uniqueRules: [],
      whereRules: [],
      instantiable: true,
    };

    expect(entity.schema.name).toBe('geometry');
    expect(entity.schema).toBe(schema);
  });

  it('should support TypeDefinition with underlying type', () => {
    const schema: ExpressSchema = {
      name: 'test',
      entities: new Map(),
      types: new Map(),
      functions: new Map(),
      procedures: new Map(),
      rules: new Map(),
      constants: new Map(),
      subtypeConstraints: new Map(),
      interfaces: [],
      diagnostics: [],
    };

    const typeDef: TypeDefinition = {
      name: 'length_measure',
      schema,
      underlyingType: { kind: 'simple', simpleType: 'REAL' },
      whereRules: [],
    };

    schema.types.set('LENGTH_MEASURE', typeDef);

    const retrieved = schema.types.get('LENGTH_MEASURE');
    expect(retrieved).toBeDefined();
    expect(retrieved!.underlyingType.kind).toBe('simple');
  });

  it('should support AggregationTypeDescriptor with nested types', () => {
    const nestedType: AggregationTypeDescriptor = {
      kind: 'aggregation',
      aggregationKind: 'LIST',
      elementType: {
        kind: 'aggregation',
        aggregationKind: 'SET',
        elementType: { kind: 'simple', simpleType: 'REAL' },
      },
    };

    expect(nestedType.elementType.kind).toBe('aggregation');
    if (nestedType.elementType.kind === 'aggregation') {
      expect(nestedType.elementType.aggregationKind).toBe('SET');
    }
  });
});
