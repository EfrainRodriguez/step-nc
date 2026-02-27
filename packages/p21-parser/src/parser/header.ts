import type { HeaderEntityNode, HeaderSectionNode } from '../ast/header';
import type { ParameterNode } from '../ast/parameter';
import { expectSemicolon, SYNC_SECTION, synchronize } from './common';
import { ParserContext } from './context';
import { parseParameterList } from './parameter';
import { spanOfToken } from './types';

export function parseHeaderSection(ctx: ParserContext): HeaderSectionNode {
  const start = ctx.startPos();

  ctx.expect('KW_HEADER');
  expectSemicolon(ctx);

  const entities: HeaderEntityNode[] = [];

  while (!ctx.isEOF() && !ctx.check('KW_ENDSEC')) {
    if (ctx.check('STANDARD_KEYWORD')) {
      entities.push(parseHeaderEntity(ctx));
    } else {
      const token = ctx.current();
      ctx.error(
        'P21P020',
        `Expected header entity keyword, found '${token.kind}'`,
        spanOfToken(token),
      );
      synchronize(ctx, SYNC_SECTION);
      break;
    }
  }

  ctx.expect('KW_ENDSEC');
  expectSemicolon(ctx);

  return {
    type: 'HeaderSection',
    entities,
    span: ctx.spanFrom(start),
  };
}

function parseHeaderEntity(ctx: ParserContext): HeaderEntityNode {
  const start = ctx.startPos();
  const keyword = ctx.consume().text; // STANDARD_KEYWORD

  ctx.expect('SYM_LPAREN');

  const parameters: ParameterNode[] = parseParameterList(ctx);

  ctx.expect('SYM_RPAREN');
  expectSemicolon(ctx);

  return {
    type: 'HeaderEntity',
    keyword,
    parameters,
    span: ctx.spanFrom(start),
  };
}
