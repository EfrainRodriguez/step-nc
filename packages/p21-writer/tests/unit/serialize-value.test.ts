import type {
  AggregationTypeDescriptor,
  EnumerationTypeDescriptor,
  SimpleTypeDescriptor,
} from '@step-nc/express-dictionary';
import type {
  AttributeValue,
  InstanceRef,
  SelectValue,
} from '@step-nc/step-factory';
import {
  INDETERMINATE,
  asInstanceId,
  createList,
  createSet,
} from '@step-nc/step-factory';
import { describe, expect, it } from 'vitest';
import { serializeAttributeValue } from '../../src/serialize-value';

const REAL_TYPE: SimpleTypeDescriptor = { kind: 'simple', simpleType: 'REAL' };
const INTEGER_TYPE: SimpleTypeDescriptor = {
  kind: 'simple',
  simpleType: 'INTEGER',
};
const STRING_TYPE: SimpleTypeDescriptor = {
  kind: 'simple',
  simpleType: 'STRING',
};
const ENUM_TYPE: EnumerationTypeDescriptor = {
  kind: 'enumeration',
  values: ['FORWARD', 'BACKWARD'],
  extensible: false,
};

describe('serializeAttributeValue', () => {
  describe('undefined and null', () => {
    it('should serialize undefined as $', () => {
      const { text } = serializeAttributeValue(undefined);
      expect(text).toBe('$');
    });

    it('should serialize null as $', () => {
      const { text } = serializeAttributeValue(null);
      expect(text).toBe('$');
    });
  });

  describe('INDETERMINATE', () => {
    it('should serialize INDETERMINATE as *', () => {
      const { text } = serializeAttributeValue(INDETERMINATE);
      expect(text).toBe('*');
    });
  });

  describe('booleans', () => {
    it('should serialize true as .T.', () => {
      const { text } = serializeAttributeValue(true);
      expect(text).toBe('.T.');
    });

    it('should serialize false as .F.', () => {
      const { text } = serializeAttributeValue(false);
      expect(text).toBe('.F.');
    });
  });

  describe('integers', () => {
    it('should serialize 0', () => {
      const { text } = serializeAttributeValue(0);
      expect(text).toBe('0');
    });

    it('should serialize positive integer', () => {
      const { text } = serializeAttributeValue(123);
      expect(text).toBe('123');
    });

    it('should serialize negative integer', () => {
      const { text } = serializeAttributeValue(-5);
      expect(text).toBe('-5');
    });

    it('should serialize MAX_SAFE_INTEGER', () => {
      const { text } = serializeAttributeValue(Number.MAX_SAFE_INTEGER);
      expect(text).toBe(String(Number.MAX_SAFE_INTEGER));
    });
  });

  describe('reals', () => {
    it('should serialize 3.14', () => {
      const { text } = serializeAttributeValue(3.14);
      expect(text).toBe('3.14');
    });

    it('should serialize -0.5', () => {
      const { text } = serializeAttributeValue(-0.5);
      expect(text).toBe('-0.5');
    });

    it('should force decimal for integer value with REAL type hint', () => {
      const { text } = serializeAttributeValue(1, REAL_TYPE);
      expect(text).toBe('1.');
    });

    it('should keep integer format for INTEGER type hint', () => {
      const { text } = serializeAttributeValue(1, INTEGER_TYPE);
      expect(text).toBe('1');
    });

    it('should handle scientific notation', () => {
      const { text } = serializeAttributeValue(1.5e10);
      expect(text).toMatch(/1\.5E10|15000000000/);
    });

    it('should produce error diagnostic for NaN', () => {
      const { text, diagnostics } = serializeAttributeValue(NaN);
      expect(text).toBe('$');
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]!.code).toBe('UNSUPPORTED_VALUE');
    });

    it('should produce error diagnostic for Infinity', () => {
      const { text, diagnostics } = serializeAttributeValue(Infinity);
      expect(text).toBe('$');
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]!.code).toBe('UNSUPPORTED_VALUE');
    });

    it('should produce error diagnostic for -Infinity', () => {
      const { text, diagnostics } = serializeAttributeValue(-Infinity);
      expect(text).toBe('$');
      expect(diagnostics).toHaveLength(1);
    });
  });

  describe('strings', () => {
    it('should serialize simple string', () => {
      const { text } = serializeAttributeValue('hello world', STRING_TYPE);
      expect(text).toBe("'hello world'");
    });

    it('should escape single quotes', () => {
      const { text } = serializeAttributeValue("it's", STRING_TYPE);
      expect(text).toBe("'it''s'");
    });

    it('should escape backslashes', () => {
      const { text } = serializeAttributeValue('a\\b', STRING_TYPE);
      expect(text).toBe("'a\\\\b'");
    });

    it('should encode non-ASCII BMP characters with \\X2\\', () => {
      const { text } = serializeAttributeValue('\u00E9', STRING_TYPE);
      expect(text).toBe("'\\X2\\00E9\\X0\\'");
    });

    it('should encode supplementary plane characters with \\X4\\', () => {
      const { text } = serializeAttributeValue('\u{1F600}', STRING_TYPE); // 😀
      expect(text).toBe("'\\X4\\0001F600\\X0\\'");
    });

    it('should serialize empty string', () => {
      const { text } = serializeAttributeValue('', STRING_TYPE);
      expect(text).toBe("''");
    });
  });

  describe('enumerations', () => {
    it('should serialize enum value with dots', () => {
      const { text } = serializeAttributeValue('FORWARD', ENUM_TYPE);
      expect(text).toBe('.FORWARD.');
    });

    it('should uppercase enum values', () => {
      const { text } = serializeAttributeValue('backward', ENUM_TYPE);
      expect(text).toBe('.BACKWARD.');
    });

    it('should serialize string without enum hint as regular string', () => {
      const { text } = serializeAttributeValue('FORWARD');
      expect(text).toBe("'FORWARD'");
    });
  });

  describe('binary', () => {
    it('should serialize Uint8Array as hex', () => {
      const data = new Uint8Array([0x0a, 0x1f]);
      const { text } = serializeAttributeValue(data);
      expect(text).toBe('"0A1F"');
    });

    it('should serialize empty Uint8Array', () => {
      const data = new Uint8Array([]);
      const { text } = serializeAttributeValue(data);
      expect(text).toBe('""');
    });
  });

  describe('InstanceRef', () => {
    it('should serialize reference as #id', () => {
      const ref: InstanceRef = {
        kind: 'ref',
        id: asInstanceId(42),
        entityName: 'POINT',
      };
      const { text } = serializeAttributeValue(ref);
      expect(text).toBe('#42');
    });
  });

  describe('SelectValue', () => {
    it('should serialize simple select', () => {
      const sv: SelectValue = {
        kind: 'select',
        typePath: ['GEOMETRIC_SELECT', 'POINT'],
        value: {
          kind: 'ref',
          id: asInstanceId(1),
          entityName: 'POINT',
        } as AttributeValue,
      };
      const { text } = serializeAttributeValue(sv);
      expect(text).toBe('POINT(#1)');
    });

    it('should serialize nested select', () => {
      const inner: SelectValue = {
        kind: 'select',
        typePath: ['INNER_SELECT', 'VALUE_TYPE'],
        value: 42 as AttributeValue,
      };
      const outer: SelectValue = {
        kind: 'select',
        typePath: ['OUTER_SELECT', 'WRAPPED'],
        value: inner,
      };
      const { text } = serializeAttributeValue(outer);
      expect(text).toBe('WRAPPED(VALUE_TYPE(42))');
    });
  });

  describe('aggregations', () => {
    it('should serialize empty list as ()', () => {
      const list = createList([]);
      const { text } = serializeAttributeValue(list);
      expect(text).toBe('()');
    });

    it('should serialize list of integers', () => {
      const list = createList([1, 2, 3]);
      const { text } = serializeAttributeValue(list);
      expect(text).toBe('(1,2,3)');
    });

    it('should serialize list of reals with type hint', () => {
      const list = createList([1.0, 2.0, 3.0]);
      const aggType: AggregationTypeDescriptor = {
        kind: 'aggregation',
        aggregationKind: 'LIST',
        elementType: REAL_TYPE,
      };
      const { text } = serializeAttributeValue(list, aggType);
      expect(text).toBe('(1.,2.,3.)');
    });

    it('should serialize nested aggregations', () => {
      const inner1 = createList([1, 2]);
      const inner2 = createList([3, 4]);
      const outer = createList([inner1, inner2]);
      const { text } = serializeAttributeValue(outer);
      expect(text).toBe('((1,2),(3,4))');
    });

    it('should serialize set', () => {
      const set = createSet([10, 20, 30]);
      const { text } = serializeAttributeValue(set);
      expect(text).toBe('(10,20,30)');
    });

    it('should serialize mixed-type aggregation', () => {
      const ref: InstanceRef = {
        kind: 'ref',
        id: asInstanceId(5),
        entityName: 'POINT',
      };
      const list = createList([ref, ref]);
      const { text } = serializeAttributeValue(list);
      expect(text).toBe('(#5,#5)');
    });
  });
});
