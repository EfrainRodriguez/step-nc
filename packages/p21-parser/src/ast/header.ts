import type { Span } from './base';
import type { ParameterNode } from './parameter';

export interface HeaderSectionNode {
  readonly type: 'HeaderSection';
  readonly entities: HeaderEntityNode[];
  readonly span: Span;
}

export interface HeaderEntityNode {
  readonly type: 'HeaderEntity';
  readonly keyword: string;
  readonly parameters: ParameterNode[];
  readonly span: Span;
}
