export interface Position {
  readonly offset: number;
  readonly line: number;
  readonly column: number;
}

export interface Span {
  readonly start: Position;
  readonly end: Position;
}

export type P21SyntaxKind =
  // Document
  | 'P21Document'

  // Sections
  | 'HeaderSection'
  | 'DataSection'
  | 'AnchorSection'
  | 'ReferenceSection'
  | 'SignatureSection'

  // Header
  | 'HeaderEntity'

  // Data
  | 'SimpleEntityInstance'
  | 'ComplexEntityInstance'
  | 'SimpleRecord'

  // Parameters
  | 'TypedParameter'
  | 'IntegerValue'
  | 'RealValue'
  | 'StringValue'
  | 'EnumerationValue'
  | 'BinaryValue'
  | 'EntityRef'
  | 'ValueRef'
  | 'ConstantEntityRef'
  | 'ConstantValueRef'
  | 'OmittedParameter'
  | 'NullParameter'
  | 'List'

  // Anchor
  | 'Anchor'
  | 'AnchorTag'

  // Reference
  | 'Reference';

export interface P21NodeBase {
  readonly type: P21SyntaxKind;
  readonly span: Span;
}
