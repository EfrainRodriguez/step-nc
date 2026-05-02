import type { AnchorSectionNode } from './anchor';
import type { Span } from './base';
import type { DataSectionNode } from './data';
import type { HeaderSectionNode } from './header';
import type { ReferenceSectionNode } from './reference';
import type { SignatureSectionNode } from './signature';

export interface P21DocumentNode {
  readonly type: 'P21Document';
  readonly header: HeaderSectionNode;
  readonly anchor?: AnchorSectionNode;
  readonly reference?: ReferenceSectionNode;
  readonly data: DataSectionNode[];
  readonly signatures: SignatureSectionNode[];
  readonly span: Span;
}
