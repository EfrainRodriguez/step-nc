import { describe, it, expect } from 'vitest';
import { lexExpress } from '../../src/lexer/lexer';
import { ParserContext } from '../../src/parser/context';
import { parseType } from '../../src/parser/types';
import type { TypeNode } from '../../src/ast/types';

function parseT(source: string): TypeNode {
  const { tokens } = lexExpress(source);
  const ctx = new ParserContext(tokens);
  return parseType(ctx);
}

describe('Simple types', () => {
  it.each([
    'INTEGER',
    'REAL',
    'NUMBER',
    'STRING',
    'BOOLEAN',
    'LOGICAL',
    'BINARY',
  ])('should parse %s', (kw) => {
    const t = parseT(kw);
    expect(t.type).toBe('SimpleType');
    if (t.type === 'SimpleType') expect(t.kind).toBe(kw);
  });

  it('should parse STRING(50)', () => {
    const t = parseT('STRING(50)');
    expect(t.type).toBe('SimpleType');
    if (t.type === 'SimpleType') expect(t.kind).toBe('STRING');
  });

  it('should parse BINARY(32) FIXED', () => {
    const t = parseT('BINARY(32) FIXED');
    expect(t.type).toBe('SimpleType');
    if (t.type === 'SimpleType') expect(t.kind).toBe('BINARY');
  });
});

describe('Aggregation types', () => {
  it('should parse ARRAY [1:10] OF INTEGER', () => {
    const t = parseT('ARRAY [1:10] OF INTEGER');
    expect(t.type).toBe('AggregationType');
    if (t.type === 'AggregationType') {
      expect(t.kind).toBe('ARRAY');
      expect(t.bounds).toBeDefined();
      expect(t.baseType.type).toBe('SimpleType');
    }
  });

  it('should parse LIST OF STRING', () => {
    const t = parseT('LIST OF STRING');
    expect(t.type).toBe('AggregationType');
    if (t.type === 'AggregationType') {
      expect(t.kind).toBe('LIST');
      expect(t.bounds).toBeUndefined();
    }
  });

  it('should parse SET [0:?] OF entity_ref', () => {
    const t = parseT('SET [0:?] OF entity_ref');
    expect(t.type).toBe('AggregationType');
    if (t.type === 'AggregationType') {
      expect(t.kind).toBe('SET');
    }
  });

  it('should parse BAG OF REAL', () => {
    const t = parseT('BAG OF REAL');
    expect(t.type).toBe('AggregationType');
    if (t.type === 'AggregationType') {
      expect(t.kind).toBe('BAG');
    }
  });

  it('should parse ARRAY [1:5] OF OPTIONAL UNIQUE some_type', () => {
    const t = parseT('ARRAY [1:5] OF OPTIONAL UNIQUE some_type');
    expect(t.type).toBe('AggregationType');
    if (t.type === 'AggregationType') {
      expect(t.baseType.type).toBe('NamedType');
    }
  });
});

describe('Enumeration types', () => {
  it('should parse ENUMERATION OF (red, green, blue)', () => {
    const t = parseT('ENUMERATION OF (red, green, blue)');
    expect(t.type).toBe('EnumerationType');
    if (t.type === 'EnumerationType') {
      expect(t.values).toEqual(['red', 'green', 'blue']);
    }
  });

  it('should parse EXTENSIBLE ENUMERATION OF (a, b)', () => {
    const t = parseT('EXTENSIBLE ENUMERATION OF (a, b)');
    expect(t.type).toBe('EnumerationType');
    if (t.type === 'EnumerationType') {
      expect(t.extensible).toBe(true);
    }
  });

  it('should parse ENUMERATION BASED_ON base_enum WITH (extra_val)', () => {
    const t = parseT('ENUMERATION BASED_ON base_enum WITH (extra_val)');
    expect(t.type).toBe('EnumerationType');
    if (t.type === 'EnumerationType') {
      expect(t.basedOn).toBe('base_enum');
      expect(t.values).toEqual(['extra_val']);
    }
  });
});

describe('Select types', () => {
  it('should parse SELECT (type1, type2, type3)', () => {
    const t = parseT('SELECT (type1, type2, type3)');
    expect(t.type).toBe('SelectType');
    if (t.type === 'SelectType') {
      expect(t.types).toEqual(['type1', 'type2', 'type3']);
    }
  });

  it('should parse EXTENSIBLE GENERIC_ENTITY SELECT (a)', () => {
    const t = parseT('EXTENSIBLE GENERIC_ENTITY SELECT (a)');
    expect(t.type).toBe('SelectType');
    if (t.type === 'SelectType') {
      expect(t.extensible).toBe(true);
      expect(t.generic).toBe(true);
    }
  });

  it('should parse SELECT BASED_ON base_select WITH (extra_type)', () => {
    const t = parseT('SELECT BASED_ON base_select WITH (extra_type)');
    expect(t.type).toBe('SelectType');
    if (t.type === 'SelectType') {
      expect(t.basedOn).toEqual(['base_select']);
      expect(t.types).toEqual(['extra_type']);
    }
  });
});

describe('Named types', () => {
  it('should parse a user-defined type name', () => {
    const t = parseT('point_3d');
    expect(t.type).toBe('NamedType');
    if (t.type === 'NamedType') expect(t.name).toBe('point_3d');
  });
});

describe('Generic types', () => {
  it('should parse GENERIC', () => {
    const t = parseT('GENERIC');
    expect(t.type).toBe('GenericType');
  });

  it('should parse GENERIC_ENTITY', () => {
    const t = parseT('GENERIC_ENTITY');
    expect(t.type).toBe('GenericEntityType');
  });
});

describe('Aggregate type', () => {
  it('should parse AGGREGATE OF INTEGER', () => {
    const t = parseT('AGGREGATE OF INTEGER');
    expect(t.type).toBe('AggregateType');
    if (t.type === 'AggregateType') {
      expect(t.baseType.type).toBe('SimpleType');
    }
  });
});

describe('Nested types', () => {
  it('should parse SET OF LIST [1:5] OF REAL', () => {
    const t = parseT('SET OF LIST [1:5] OF REAL');
    expect(t.type).toBe('AggregationType');
    if (t.type === 'AggregationType') {
      expect(t.kind).toBe('SET');
      expect(t.baseType.type).toBe('AggregationType');
    }
  });
});
