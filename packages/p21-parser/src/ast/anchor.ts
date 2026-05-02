import type { Span } from './base';
import type { ParameterNode } from './parameter';

export type AnchorItemNode = ParameterNode;

export interface AnchorSectionNode {
  readonly type: 'AnchorSection';
  readonly anchors: AnchorNode[];
  readonly span: Span;
}

export interface AnchorNode {
  readonly type: 'Anchor';
  readonly name: string;
  readonly item: AnchorItemNode;
  readonly tags: AnchorTagNode[];
  readonly span: Span;
}

export interface AnchorTagNode {
  readonly type: 'AnchorTag';
  readonly tag: string;
  readonly item: AnchorItemNode;
  readonly span: Span;
}
