import { describe, expect, it } from 'vitest';
import { lexP21 } from '../../src/lexer/lexer';
import { ParserContext } from '../../src/parser/context';
import { parseParameter, parseParameterList } from '../../src/parser/parameter';

function makeCtx(source: string): ParserContext {
  const { tokens } = lexP21(source);
  return new ParserContext(tokens);
}

describe('parseParameter', () => {
  it('parses null ($)', () => {
    const ctx = makeCtx('$');
    const node = parseParameter(ctx);
    expect(node.type).toBe('NullParameter');
  });

  it('parses omitted (*)', () => {
    const ctx = makeCtx('*');
    const node = parseParameter(ctx);
    expect(node.type).toBe('OmittedParameter');
  });

  it('parses integer', () => {
    const ctx = makeCtx('42');
    const node = parseParameter(ctx);
    expect(node.type).toBe('IntegerValue');
    if (node.type === 'IntegerValue') {
      expect(node.value).toBe(42);
    }
  });

  it('parses negative integer', () => {
    const ctx = makeCtx('-5');
    const node = parseParameter(ctx);
    expect(node.type).toBe('IntegerValue');
    if (node.type === 'IntegerValue') {
      expect(node.value).toBe(-5);
    }
  });

  it('parses real', () => {
    const ctx = makeCtx('3.14');
    const node = parseParameter(ctx);
    expect(node.type).toBe('RealValue');
    if (node.type === 'RealValue') {
      expect(node.value).toBeCloseTo(3.14);
    }
  });

  it('parses real with exponent', () => {
    const ctx = makeCtx('1.0E-3');
    const node = parseParameter(ctx);
    expect(node.type).toBe('RealValue');
    if (node.type === 'RealValue') {
      expect(node.value).toBeCloseTo(0.001);
    }
  });

  it('parses string', () => {
    const ctx = makeCtx("'hello'");
    const node = parseParameter(ctx);
    expect(node.type).toBe('StringValue');
  });

  it('parses enumeration', () => {
    const ctx = makeCtx('.TRUE.');
    const node = parseParameter(ctx);
    expect(node.type).toBe('EnumerationValue');
    if (node.type === 'EnumerationValue') {
      expect(node.value).toBe('.TRUE.');
    }
  });

  it('parses binary', () => {
    const ctx = makeCtx('"1A2F"');
    const node = parseParameter(ctx);
    expect(node.type).toBe('BinaryValue');
  });

  it('parses entity ref', () => {
    const ctx = makeCtx('#123');
    const node = parseParameter(ctx);
    expect(node.type).toBe('EntityRef');
    if (node.type === 'EntityRef') {
      expect(node.id).toBe(123);
    }
  });

  it('parses value ref', () => {
    const ctx = makeCtx('@5');
    const node = parseParameter(ctx);
    expect(node.type).toBe('ValueRef');
    if (node.type === 'ValueRef') {
      expect(node.id).toBe(5);
    }
  });

  it('parses constant entity ref', () => {
    const ctx = makeCtx('#IMPERIAL_LENGTH_INCH');
    const node = parseParameter(ctx);
    expect(node.type).toBe('ConstantEntityRef');
    if (node.type === 'ConstantEntityRef') {
      expect(node.name).toBe('IMPERIAL_LENGTH_INCH');
    }
  });

  it('parses typed parameter', () => {
    const ctx = makeCtx('SOME_TYPE(42)');
    const node = parseParameter(ctx);
    expect(node.type).toBe('TypedParameter');
    if (node.type === 'TypedParameter') {
      expect(node.keyword).toBe('SOME_TYPE');
      expect(node.parameter.type).toBe('IntegerValue');
    }
  });

  it('parses nested typed parameter', () => {
    const ctx = makeCtx('OUTER(INNER(3.14))');
    const node = parseParameter(ctx);
    expect(node.type).toBe('TypedParameter');
    if (node.type === 'TypedParameter') {
      expect(node.keyword).toBe('OUTER');
      expect(node.parameter.type).toBe('TypedParameter');
    }
  });

  it('parses empty list', () => {
    const ctx = makeCtx('()');
    const node = parseParameter(ctx);
    expect(node.type).toBe('List');
    if (node.type === 'List') {
      expect(node.items).toHaveLength(0);
    }
  });

  it('parses list of integers', () => {
    const ctx = makeCtx('(1,2,3)');
    const node = parseParameter(ctx);
    expect(node.type).toBe('List');
    if (node.type === 'List') {
      expect(node.items).toHaveLength(3);
    }
  });

  it('parses nested list', () => {
    const ctx = makeCtx('((1,2),(3,4))');
    const node = parseParameter(ctx);
    expect(node.type).toBe('List');
    if (node.type === 'List') {
      expect(node.items).toHaveLength(2);
      expect(node.items[0]!.type).toBe('List');
      expect(node.items[1]!.type).toBe('List');
    }
  });

  it('parses mixed parameter list', () => {
    const ctx = makeCtx("(42,'text',.ENUM.,#1,$,*)");
    const node = parseParameter(ctx);
    expect(node.type).toBe('List');
    if (node.type === 'List') {
      expect(node.items).toHaveLength(6);
      expect(node.items[0]!.type).toBe('IntegerValue');
      expect(node.items[1]!.type).toBe('StringValue');
      expect(node.items[2]!.type).toBe('EnumerationValue');
      expect(node.items[3]!.type).toBe('EntityRef');
      expect(node.items[4]!.type).toBe('NullParameter');
      expect(node.items[5]!.type).toBe('OmittedParameter');
    }
  });
});

describe('parseParameterList', () => {
  it('parses comma-separated parameters', () => {
    const ctx = makeCtx('0.0,0.0,0.0)');
    const items = parseParameterList(ctx);
    expect(items).toHaveLength(3);
    expect(items.every((i) => i.type === 'RealValue')).toBe(true);
  });
});
