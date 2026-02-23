import type { SchemaDeclarationNode } from '../ast/declarations';
import { lexExpress } from '../lexer/lexer';
import { ParserContext } from './context';
import { parseSchema } from './schema';
import type { ParseDiagnostic, ParseOptions } from './types';

/**
 * Result of parsing an EXPRESS source string.
 * - `ast`: Root of the typed AST; a single schema declaration (SchemaDeclarationNode).
 * - `diagnostics`: List of lexer and parser diagnostics (errors and warnings).
 */
export interface ParseResult {
  ast: SchemaDeclarationNode;
  diagnostics: ParseDiagnostic[];
}

/**
 * Parses an EXPRESS source string into a typed AST.
 * Runs the lexer, then the recursive-descent parser, and merges diagnostics from both phases.
 *
 * @param source - The EXPRESS schema source text.
 * @param options - Optional parser options (e.g. maxExplicitAttributes, maxEntitySectionItems).
 * @returns ParseResult with `ast` (SchemaDeclarationNode) and `diagnostics` (ParseDiagnostic[]).
 */
export function parseExpress(
  source: string,
  options?: ParseOptions,
): ParseResult {
  const lexResult = lexExpress(source);
  const ctx = new ParserContext(lexResult.tokens, options);

  const ast = parseSchema(ctx);

  const diagnostics: ParseDiagnostic[] = [
    ...lexResult.diagnostics.map((d) => ({
      code: d.code,
      message: d.message,
      span: {
        start: { offset: d.offset, line: d.line, column: d.column },
        end: { offset: d.offset + 1, line: d.line, column: d.column + 1 },
      },
      severity: d.severity,
    })),
    ...ctx.diagnostics,
  ];

  return { ast, diagnostics };
}
