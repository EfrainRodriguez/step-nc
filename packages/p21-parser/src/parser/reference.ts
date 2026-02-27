import type { ReferenceNode, ReferenceSectionNode } from '../ast/reference';
import { expectSemicolon } from './common';
import { ParserContext } from './context';
import { spanOfToken } from './types';

export function parseReferenceSection(
  ctx: ParserContext,
): ReferenceSectionNode {
  const start = ctx.startPos();

  ctx.expect('KW_REFERENCE');
  expectSemicolon(ctx);

  const references: ReferenceNode[] = [];

  while (!ctx.isEOF() && !ctx.check('KW_ENDSEC')) {
    if (ctx.check('ENTITY_INSTANCE_NAME') || ctx.check('VALUE_INSTANCE_NAME')) {
      references.push(parseReference(ctx));
    } else {
      const token = ctx.current();
      ctx.error(
        'P21P050',
        `Expected entity or value instance name, found '${token.kind}'`,
        spanOfToken(token),
      );
      break;
    }
  }

  ctx.expect('KW_ENDSEC');
  expectSemicolon(ctx);

  return {
    type: 'ReferenceSection',
    references,
    span: ctx.spanFrom(start),
  };
}

function parseReference(ctx: ParserContext): ReferenceNode {
  const start = ctx.startPos();

  const lhsToken = ctx.consume(); // ENTITY_INSTANCE_NAME or VALUE_INSTANCE_NAME
  const target = lhsToken.text;
  const targetId = parseInt(lhsToken.text.slice(1), 10);

  ctx.expect('SYM_EQUALS');

  let resource = '';
  if (ctx.check('RESOURCE')) {
    const resToken = ctx.consume();
    resource = resToken.text.slice(1, -1); // Remove < and >
  } else {
    const token = ctx.current();
    ctx.error(
      'P21P051',
      `Expected resource URI (<...>), found '${token.kind}'`,
      spanOfToken(token),
    );
  }

  expectSemicolon(ctx);

  return {
    type: 'Reference',
    target,
    targetId,
    resource,
    span: ctx.spanFrom(start),
  };
}
