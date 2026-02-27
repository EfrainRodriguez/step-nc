import type { Span } from './base';

export interface SignatureSectionNode {
  readonly type: 'SignatureSection';
  readonly content: string;
  readonly span: Span;
}
