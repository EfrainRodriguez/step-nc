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
  ParameterNode,
  RealValueNode,
  StringValueNode,
  TypedParameterNode,
  ValueRefNode,
} from '../ast/parameter';
import { ParserContext } from './context';
import { spanOfToken } from './types';

export function parseParameterList(ctx: ParserContext): ParameterNode[] {
  const items: ParameterNode[] = [];
  if (ctx.check('SYM_RPAREN')) return items;

  items.push(parseParameter(ctx));
  while (ctx.skip('SYM_COMMA')) {
    items.push(parseParameter(ctx));
  }
  return items;
}

export function parseParameter(ctx: ParserContext): ParameterNode {
  const token = ctx.current();

  switch (token.kind) {
    case 'SYM_DOLLAR': {
      const start = ctx.startPos();
      ctx.consume();
      return {
        type: 'NullParameter',
        span: ctx.spanFrom(start),
      } as NullParameterNode;
    }

    case 'SYM_STAR': {
      const start = ctx.startPos();
      ctx.consume();
      return {
        type: 'OmittedParameter',
        span: ctx.spanFrom(start),
      } as OmittedParameterNode;
    }

    case 'INTEGER': {
      const start = ctx.startPos();
      const t = ctx.consume();
      return {
        type: 'IntegerValue',
        value: parseInt(t.text, 10),
        span: ctx.spanFrom(start),
      } as IntegerValueNode;
    }

    case 'REAL': {
      const start = ctx.startPos();
      const t = ctx.consume();
      return {
        type: 'RealValue',
        value: parseFloat(t.text),
        span: ctx.spanFrom(start),
      } as RealValueNode;
    }

    case 'STRING': {
      const start = ctx.startPos();
      const t = ctx.consume();
      return {
        type: 'StringValue',
        value: t.text,
        span: ctx.spanFrom(start),
      } as StringValueNode;
    }

    case 'ENUMERATION': {
      const start = ctx.startPos();
      const t = ctx.consume();
      return {
        type: 'EnumerationValue',
        value: t.text,
        span: ctx.spanFrom(start),
      } as EnumerationValueNode;
    }

    case 'BINARY': {
      const start = ctx.startPos();
      const t = ctx.consume();
      return {
        type: 'BinaryValue',
        value: t.text,
        span: ctx.spanFrom(start),
      } as BinaryValueNode;
    }

    case 'ENTITY_INSTANCE_NAME': {
      const start = ctx.startPos();
      const t = ctx.consume();
      return {
        type: 'EntityRef',
        id: parseInt(t.text.slice(1), 10),
        span: ctx.spanFrom(start),
      } as EntityRefNode;
    }

    case 'VALUE_INSTANCE_NAME': {
      const start = ctx.startPos();
      const t = ctx.consume();
      return {
        type: 'ValueRef',
        id: parseInt(t.text.slice(1), 10),
        span: ctx.spanFrom(start),
      } as ValueRefNode;
    }

    case 'CONSTANT_ENTITY_NAME': {
      const start = ctx.startPos();
      const t = ctx.consume();
      return {
        type: 'ConstantEntityRef',
        name: t.text.slice(1),
        span: ctx.spanFrom(start),
      } as ConstantEntityRefNode;
    }

    case 'CONSTANT_VALUE_NAME': {
      const start = ctx.startPos();
      const t = ctx.consume();
      return {
        type: 'ConstantValueRef',
        name: t.text.slice(1),
        span: ctx.spanFrom(start),
      } as ConstantValueRefNode;
    }

    case 'SYM_LPAREN':
      return parseList(ctx);

    case 'STANDARD_KEYWORD': {
      // Typed parameter: KEYWORD(parameter) or just a keyword as a simple record
      if (ctx.peek(1).kind === 'SYM_LPAREN') {
        return parseTypedParameter(ctx);
      }
      // Fallthrough: unexpected keyword in parameter position
      const start = ctx.startPos();
      const t = ctx.consume();
      ctx.error(
        'P21P010',
        `Unexpected keyword '${t.text}' in parameter position`,
        spanOfToken(t),
      );
      return {
        type: 'NullParameter',
        span: ctx.spanFrom(start),
      } as NullParameterNode;
    }

    case 'SYM_PLUS':
    case 'SYM_MINUS': {
      return parseSignedNumber(ctx);
    }

    default: {
      const start = ctx.startPos();
      const t = ctx.current();
      ctx.error(
        'P21P011',
        `Unexpected token '${t.kind}' in parameter position`,
        spanOfToken(t),
      );
      ctx.consume();
      return {
        type: 'NullParameter',
        span: ctx.spanFrom(start),
      } as NullParameterNode;
    }
  }
}

function parseTypedParameter(ctx: ParserContext): TypedParameterNode {
  const start = ctx.startPos();
  const keyword = ctx.consume().text; // STANDARD_KEYWORD
  ctx.expect('SYM_LPAREN');
  const parameter = parseParameter(ctx);
  ctx.expect('SYM_RPAREN');
  return {
    type: 'TypedParameter',
    keyword,
    parameter,
    span: ctx.spanFrom(start),
  };
}

export function parseList(ctx: ParserContext): ListNode {
  const start = ctx.startPos();
  ctx.expect('SYM_LPAREN');
  const items = parseParameterList(ctx);
  ctx.expect('SYM_RPAREN');
  return {
    type: 'List',
    items,
    span: ctx.spanFrom(start),
  };
}

function parseSignedNumber(
  ctx: ParserContext,
): IntegerValueNode | RealValueNode {
  const start = ctx.startPos();
  const sign = ctx.consume(); // + or -
  const next = ctx.current();

  if (next.kind === 'INTEGER') {
    const t = ctx.consume();
    const value = parseInt(t.text, 10) * (sign.text === '-' ? -1 : 1);
    return { type: 'IntegerValue', value, span: ctx.spanFrom(start) };
  }

  if (next.kind === 'REAL') {
    const t = ctx.consume();
    const value = parseFloat(t.text) * (sign.text === '-' ? -1 : 1);
    return { type: 'RealValue', value, span: ctx.spanFrom(start) };
  }

  ctx.error(
    'P21P012',
    `Expected number after '${sign.text}'`,
    spanOfToken(next),
  );
  return { type: 'IntegerValue', value: 0, span: ctx.spanFrom(start) };
}
