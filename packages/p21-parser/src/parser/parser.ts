import type { AnchorSectionNode } from '../ast/anchor';
import type { DataSectionNode } from '../ast/data';
import type { P21DocumentNode } from '../ast/document';
import type { HeaderSectionNode } from '../ast/header';
import type { ReferenceSectionNode } from '../ast/reference';
import type { SignatureSectionNode } from '../ast/signature';
import { lexP21 } from '../lexer/lexer';
import type { P21LexDiagnostic } from '../lexer/types';
import { parseAnchorSection } from './anchor';
import { expectSemicolon, SYNC_SECTION, synchronize } from './common';
import { ParserContext } from './context';
import { parseDataSection } from './data';
import { parseHeaderSection } from './header';
import { parseReferenceSection } from './reference';
import { parseSignatureSection } from './signature';
import type { P21ParseDiagnostic, P21ParseOptions } from './types';
import { spanOfToken } from './types';

export interface ParseResult {
  ast: P21DocumentNode;
  diagnostics: P21ParseDiagnostic[];
}

function mapLexDiagnostics(lexDiags: P21LexDiagnostic[]): P21ParseDiagnostic[] {
  return lexDiags.map((d) => ({
    code: d.code,
    message: d.message,
    span: {
      start: { offset: d.offset, line: d.line, column: d.column },
      end: { offset: d.offset + 1, line: d.line, column: d.column + 1 },
    },
    severity: d.severity,
  }));
}

export function parseP21(
  source: string,
  options?: P21ParseOptions,
): ParseResult {
  const lexResult = lexP21(source);
  const ctx = new ParserContext(lexResult.tokens, options);

  const start = ctx.startPos();

  // ISO-10303-21;
  if (ctx.check('KW_ISO_10303_21')) {
    ctx.consume();
    expectSemicolon(ctx);
  } else {
    const token = ctx.current();
    ctx.error(
      'P21P060',
      `Expected 'ISO-10303-21' at start of file, found '${token.kind}'`,
      spanOfToken(token),
    );
  }

  // HEADER section (required)
  let header: HeaderSectionNode;
  if (ctx.check('KW_HEADER')) {
    header = parseHeaderSection(ctx);
  } else {
    const token = ctx.current();
    ctx.error(
      'P21P061',
      `Expected HEADER section, found '${token.kind}'`,
      spanOfToken(token),
    );
    header = {
      type: 'HeaderSection',
      entities: [],
      span: ctx.spanFrom(start),
    };
    synchronize(ctx, SYNC_SECTION);
  }

  // ANCHOR section (optional)
  let anchor: AnchorSectionNode | undefined;
  if (ctx.check('KW_ANCHOR')) {
    anchor = parseAnchorSection(ctx);
  }

  // REFERENCE section (optional)
  let reference: ReferenceSectionNode | undefined;
  if (ctx.check('KW_REFERENCE')) {
    reference = parseReferenceSection(ctx);
  }

  // DATA sections (zero or more)
  const data: DataSectionNode[] = [];
  while (ctx.check('KW_DATA')) {
    data.push(parseDataSection(ctx));
  }

  // END-ISO-10303-21;
  if (ctx.check('KW_END_ISO_10303_21')) {
    ctx.consume();
    expectSemicolon(ctx);
  } else {
    const token = ctx.current();
    ctx.error(
      'P21P062',
      `Expected 'END-ISO-10303-21', found '${token.kind}'`,
      spanOfToken(token),
    );
  }

  // SIGNATURE sections (zero or more, after END-ISO-10303-21)
  const signatures: SignatureSectionNode[] = [];
  while (ctx.check('KW_SIGNATURE')) {
    signatures.push(parseSignatureSection(ctx));
  }

  const ast: P21DocumentNode = {
    type: 'P21Document',
    header,
    ...(anchor !== undefined ? { anchor } : {}),
    ...(reference !== undefined ? { reference } : {}),
    data,
    signatures,
    span: ctx.spanFrom(start),
  };

  const diagnostics: P21ParseDiagnostic[] = [
    ...mapLexDiagnostics(lexResult.diagnostics),
    ...ctx.diagnostics,
  ];

  return { ast, diagnostics };
}
