import type {
  AnchorItemNode,
  AnchorNode,
  AnchorSectionNode,
  AnchorTagNode,
} from '../ast/anchor';
import { expectSemicolon } from './common';
import { ParserContext } from './context';
import { parseParameter } from './parameter';
import { spanOfToken } from './types';

export function parseAnchorSection(ctx: ParserContext): AnchorSectionNode {
  const start = ctx.startPos();

  ctx.expect('KW_ANCHOR');
  expectSemicolon(ctx);

  const anchors: AnchorNode[] = [];

  while (!ctx.isEOF() && !ctx.check('KW_ENDSEC')) {
    if (ctx.check('ANCHOR_NAME')) {
      anchors.push(parseAnchor(ctx));
    } else {
      const token = ctx.current();
      ctx.error(
        'P21P040',
        `Expected anchor name (<...>), found '${token.kind}'`,
        spanOfToken(token),
      );
      break;
    }
  }

  ctx.expect('KW_ENDSEC');
  expectSemicolon(ctx);

  return {
    type: 'AnchorSection',
    anchors,
    span: ctx.spanFrom(start),
  };
}

function parseAnchor(ctx: ParserContext): AnchorNode {
  const start = ctx.startPos();

  const nameToken = ctx.consume(); // ANCHOR_NAME
  const name = nameToken.text.slice(1, -1); // Remove < and >

  ctx.expect('SYM_EQUALS');

  const item: AnchorItemNode = parseParameter(ctx);

  const tags: AnchorTagNode[] = [];
  while (ctx.check('SYM_LBRACE')) {
    tags.push(parseAnchorTag(ctx));
  }

  expectSemicolon(ctx);

  return {
    type: 'Anchor',
    name,
    item,
    tags,
    span: ctx.spanFrom(start),
  };
}

function parseAnchorTag(ctx: ParserContext): AnchorTagNode {
  const start = ctx.startPos();

  ctx.expect('SYM_LBRACE');

  const tagToken = ctx.current();
  let tag: string;
  if (tagToken.kind === 'TAG_NAME' || tagToken.kind === 'STANDARD_KEYWORD') {
    tag = ctx.consume().text;
  } else {
    ctx.error(
      'P21P041',
      `Expected tag name, found '${tagToken.kind}'`,
      spanOfToken(tagToken),
    );
    tag = '<error>';
  }

  ctx.expect('SYM_COLON');

  const item: AnchorItemNode = parseParameter(ctx);

  ctx.expect('SYM_RBRACE');

  return {
    type: 'AnchorTag',
    tag,
    item,
    span: ctx.spanFrom(start),
  };
}
