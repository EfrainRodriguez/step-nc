import type { P21TokenKind } from '../lexer/types';
import { ParserContext } from './context';
import { spanOfToken } from './types';

export const SYNC_SECTION: ReadonlySet<P21TokenKind> = new Set<P21TokenKind>([
  'KW_HEADER',
  'KW_DATA',
  'KW_ANCHOR',
  'KW_REFERENCE',
  'KW_SIGNATURE',
  'KW_ENDSEC',
  'KW_END_ISO_10303_21',
  'EOF',
]);

export const SYNC_ENTITY: ReadonlySet<P21TokenKind> = new Set<P21TokenKind>([
  'ENTITY_INSTANCE_NAME',
  'KW_ENDSEC',
  'KW_END_ISO_10303_21',
  'EOF',
]);

export const SYNC_PARAMETER: ReadonlySet<P21TokenKind> = new Set<P21TokenKind>([
  'SYM_COMMA',
  'SYM_RPAREN',
  'SYM_SEMICOLON',
  'EOF',
]);

export function synchronize(
  ctx: ParserContext,
  syncTokens: ReadonlySet<P21TokenKind>,
): void {
  while (!ctx.isEOF() && !syncTokens.has(ctx.current().kind)) {
    ctx.consume();
  }
}

export function expectSemicolon(ctx: ParserContext): void {
  if (ctx.check('SYM_SEMICOLON')) {
    ctx.consume();
    return;
  }
  const token = ctx.current();
  ctx.error(
    'P21P050',
    `Missing semicolon before '${token.kind}'`,
    spanOfToken(token),
  );
}
