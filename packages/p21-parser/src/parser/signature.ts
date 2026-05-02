import type { SignatureSectionNode } from '../ast/signature';
import { expectSemicolon } from './common';
import { ParserContext } from './context';

export function parseSignatureSection(
  ctx: ParserContext,
): SignatureSectionNode {
  const start = ctx.startPos();

  ctx.expect('KW_SIGNATURE');

  // Capture everything until ENDSEC as raw content
  let content = '';
  while (!ctx.isEOF() && !ctx.check('KW_ENDSEC')) {
    const token = ctx.consume();
    if (content.length > 0) content += ' ';
    content += token.text;
  }

  ctx.expect('KW_ENDSEC');
  expectSemicolon(ctx);

  return {
    type: 'SignatureSection',
    content: content.trim(),
    span: ctx.spanFrom(start),
  };
}
