// Main entry points
export { lexP21 } from './lexer/lexer';
export type { LexResult } from './lexer/lexer';
export { parseP21 } from './parser/parser';
export type { ParseResult } from './parser/parser';

// Lexer types
export type { P21Token, P21TokenKind, P21LexDiagnostic } from './lexer/types';

// AST types
export type { Position, Span, P21SyntaxKind, P21NodeBase } from './ast/base';
export type { P21DocumentNode } from './ast/document';
export type { HeaderSectionNode, HeaderEntityNode } from './ast/header';
export type {
  DataSectionNode,
  EntityInstanceNode,
  SimpleEntityInstanceNode,
  ComplexEntityInstanceNode,
  SimpleRecordNode,
} from './ast/data';
export type {
  ParameterNode,
  TypedParameterNode,
  ListNode,
  IntegerValueNode,
  RealValueNode,
  StringValueNode,
  EnumerationValueNode,
  BinaryValueNode,
  EntityRefNode,
  ValueRefNode,
  ConstantEntityRefNode,
  ConstantValueRefNode,
  OmittedParameterNode,
  NullParameterNode,
} from './ast/parameter';
export type {
  AnchorSectionNode,
  AnchorNode,
  AnchorItemNode,
  AnchorTagNode,
} from './ast/anchor';
export type { ReferenceSectionNode, ReferenceNode } from './ast/reference';
export type { SignatureSectionNode } from './ast/signature';
export { getChildren } from './ast/children';

// Parser types
export type {
  P21ParseDiagnostic,
  P21ParseOptions,
  DiagnosticSeverity,
} from './parser/types';
export {
  tokenStart,
  tokenEnd,
  spanBetween,
  spanOfToken,
  spanFromTokens,
} from './parser/types';
export { ParserContext } from './parser/context';

// Visitor
export type { P21Visitor, VisitorAction } from './visitor/types';
export { visit } from './visitor/visit';
export { walk } from './visitor/walk';
export type { WalkOptions } from './visitor/walk';
