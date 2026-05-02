import type { Span } from './base';

export interface ReferenceSectionNode {
  readonly type: 'ReferenceSection';
  readonly references: ReferenceNode[];
  readonly span: Span;
}

export interface ReferenceNode {
  readonly type: 'Reference';
  readonly target: string;
  readonly targetId: number;
  readonly resource: string;
  readonly span: Span;
}
