import type {
  ExpressSchema,
  TypeDescriptor,
} from '@step-nc/express-dictionary';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import type {
  BinaryValueNode,
  ConstantEntityRefNode,
  ConstantValueRefNode,
  EntityRefNode,
  EnumerationValueNode,
  IntegerValueNode,
  ListNode,
  NullParameterNode,
  OmittedParameterNode,
  RealValueNode,
  Span,
  StringValueNode,
  TypedParameterNode,
  ValueRefNode,
} from '@step-nc/p21-parser';
import {
  INDETERMINATE,
  isInstanceRef,
  isStepAggregation,
} from '@step-nc/step-factory';
import { describe, expect, it } from 'vitest';
import { convertParameter } from '../../src/parameter-converter';

const DUMMY_SPAN: Span = {
  start: { offset: 0, line: 1, column: 0 },
  end: { offset: 1, line: 1, column: 1 },
};

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
  SCHEMA CONVERTER_TEST;
    TYPE label = STRING;
    END_TYPE;

    TYPE length_measure = REAL;
    END_TYPE;

    TYPE direction_type = ENUMERATION OF (forward, backward, left, right);
    END_TYPE;

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

    ENTITY line;
      name : label;
      coords : LIST [1:?] OF REAL;
      dir : direction_type;
    END_ENTITY;
  END_SCHEMA;
`);

describe('convertParameter', () => {
  const integerType: TypeDescriptor = { kind: 'simple', simpleType: 'INTEGER' };
  const realType: TypeDescriptor = { kind: 'simple', simpleType: 'REAL' };
  const stringType: TypeDescriptor = { kind: 'simple', simpleType: 'STRING' };
  const binaryType: TypeDescriptor = { kind: 'simple', simpleType: 'BINARY' };

  describe('IntegerValue', () => {
    it('should convert integer', () => {
      const node: IntegerValueNode = {
        type: 'IntegerValue',
        value: 42,
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, integerType, SCHEMA);
      expect(result.value).toBe(42);
      expect(result.diagnostics).toHaveLength(0);
    });

    it('should convert negative integer', () => {
      const node: IntegerValueNode = {
        type: 'IntegerValue',
        value: -7,
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, integerType, SCHEMA);
      expect(result.value).toBe(-7);
    });
  });

  describe('RealValue', () => {
    it('should convert real', () => {
      const node: RealValueNode = {
        type: 'RealValue',
        value: 3.14,
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, realType, SCHEMA);
      expect(result.value).toBe(3.14);
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe('StringValue', () => {
    it('should strip quotes and decode doubled apostrophes', () => {
      const node: StringValueNode = {
        type: 'StringValue',
        value: "'hello''s world'",
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, stringType, SCHEMA);
      expect(result.value).toBe("hello's world");
    });

    it('should handle simple string', () => {
      const node: StringValueNode = {
        type: 'StringValue',
        value: "'Origin'",
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, stringType, SCHEMA);
      expect(result.value).toBe('Origin');
    });
  });

  describe('EnumerationValue', () => {
    it('should strip dots from enumeration', () => {
      const node: EnumerationValueNode = {
        type: 'EnumerationValue',
        value: '.FORWARD.',
        span: DUMMY_SPAN,
      };
      const enumType = SCHEMA.types.get('DIRECTION_TYPE')!.underlyingType;
      const result = convertParameter(node, enumType, SCHEMA);
      expect(result.value).toBe('FORWARD');
      expect(result.diagnostics).toHaveLength(0);
    });

    it('should warn on invalid enum value', () => {
      const node: EnumerationValueNode = {
        type: 'EnumerationValue',
        value: '.INVALID.',
        span: DUMMY_SPAN,
      };
      const enumType = SCHEMA.types.get('DIRECTION_TYPE')!.underlyingType;
      const result = convertParameter(node, enumType, SCHEMA);
      expect(result.value).toBe('INVALID');
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]!.code).toBe('PARAMETER_TYPE_MISMATCH');
    });
  });

  describe('BinaryValue', () => {
    it('should decode hex binary', () => {
      const node: BinaryValueNode = {
        type: 'BinaryValue',
        value: '"0FF"',
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, binaryType, SCHEMA);
      expect(result.value).toBeInstanceOf(Uint8Array);
      expect((result.value as Uint8Array)[0]).toBe(0xff);
    });
  });

  describe('EntityRef', () => {
    it('should produce a placeholder ref with empty entityName', () => {
      const node: EntityRefNode = {
        type: 'EntityRef',
        id: 10,
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, undefined, SCHEMA);
      expect(isInstanceRef(result.value!)).toBe(true);
      const ref = result.value as {
        kind: 'ref';
        id: number;
        entityName: string;
      };
      expect(ref.id).toBe(10);
      expect(ref.entityName).toBe('');
    });
  });

  describe('ValueRef', () => {
    it('should produce INDETERMINATE with warning', () => {
      const node: ValueRefNode = { type: 'ValueRef', id: 5, span: DUMMY_SPAN };
      const result = convertParameter(node, undefined, SCHEMA);
      expect(result.value).toBe(INDETERMINATE);
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]!.code).toBe('DANGLING_VALUE_REF');
    });
  });

  describe('ConstantEntityRef / ConstantValueRef', () => {
    it('should warn and return INDETERMINATE for unknown constant entity', () => {
      const node: ConstantEntityRefNode = {
        type: 'ConstantEntityRef',
        name: 'UNKNOWN',
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, undefined, SCHEMA);
      expect(result.value).toBe(INDETERMINATE);
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]!.code).toBe('UNKNOWN_CONSTANT');
    });

    it('should warn and return INDETERMINATE for unknown constant value', () => {
      const node: ConstantValueRefNode = {
        type: 'ConstantValueRef',
        name: 'UNKNOWN',
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, undefined, SCHEMA);
      expect(result.value).toBe(INDETERMINATE);
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]!.code).toBe('UNKNOWN_CONSTANT');
    });
  });

  describe('OmittedParameter / NullParameter', () => {
    it('OmittedParameter (*) should produce INDETERMINATE', () => {
      const node: OmittedParameterNode = {
        type: 'OmittedParameter',
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, undefined, SCHEMA);
      expect(result.value).toBe(INDETERMINATE);
    });

    it('NullParameter ($) should produce null', () => {
      const node: NullParameterNode = {
        type: 'NullParameter',
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, undefined, SCHEMA);
      expect(result.value).toBeNull();
    });
  });

  describe('List → aggregation', () => {
    it('should convert list to StepList', () => {
      const listType: TypeDescriptor = {
        kind: 'aggregation',
        aggregationKind: 'LIST',
        elementType: realType,
      };
      const node: ListNode = {
        type: 'List',
        items: [
          { type: 'RealValue', value: 1.0, span: DUMMY_SPAN },
          { type: 'RealValue', value: 2.0, span: DUMMY_SPAN },
          { type: 'RealValue', value: 3.0, span: DUMMY_SPAN },
        ],
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, listType, SCHEMA);
      expect(isStepAggregation(result.value!)).toBe(true);
      const agg = result.value as {
        kind: string;
        elements: readonly unknown[];
      };
      expect(agg.kind).toBe('list');
      expect(agg.elements).toHaveLength(3);
      expect(agg.elements[0]).toBe(1.0);
    });

    it('should convert list to StepSet', () => {
      const setType: TypeDescriptor = {
        kind: 'aggregation',
        aggregationKind: 'SET',
        elementType: stringType,
      };
      const node: ListNode = {
        type: 'List',
        items: [
          { type: 'StringValue', value: "'a'", span: DUMMY_SPAN },
          { type: 'StringValue', value: "'b'", span: DUMMY_SPAN },
        ],
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, setType, SCHEMA);
      const agg = result.value as {
        kind: string;
        elements: readonly unknown[];
      };
      expect(agg.kind).toBe('set');
      expect(agg.elements).toHaveLength(2);
    });

    it('should convert list to StepBag', () => {
      const bagType: TypeDescriptor = {
        kind: 'aggregation',
        aggregationKind: 'BAG',
        elementType: integerType,
      };
      const node: ListNode = {
        type: 'List',
        items: [
          { type: 'IntegerValue', value: 1, span: DUMMY_SPAN },
          { type: 'IntegerValue', value: 1, span: DUMMY_SPAN },
        ],
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, bagType, SCHEMA);
      const agg = result.value as {
        kind: string;
        elements: readonly unknown[];
      };
      expect(agg.kind).toBe('bag');
      expect(agg.elements).toHaveLength(2);
    });

    it('should default to LIST when no type descriptor', () => {
      const node: ListNode = {
        type: 'List',
        items: [{ type: 'IntegerValue', value: 10, span: DUMMY_SPAN }],
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, undefined, SCHEMA);
      const agg = result.value as {
        kind: string;
        elements: readonly unknown[];
      };
      expect(agg.kind).toBe('list');
    });
  });

  describe('TypedParameter', () => {
    it('should unwrap defined type wrapper', () => {
      const lengthType = SCHEMA.types.get('LENGTH_MEASURE')!.underlyingType;
      const node: TypedParameterNode = {
        type: 'TypedParameter',
        keyword: 'LENGTH_MEASURE',
        parameter: { type: 'RealValue', value: 5.5, span: DUMMY_SPAN },
        span: DUMMY_SPAN,
      };
      const result = convertParameter(node, lengthType, SCHEMA);
      expect(result.value).toBe(5.5);
    });
  });
});
