import type {
  AnchorNode,
  AnchorSectionNode,
  AnchorTagNode,
} from '../ast/anchor';
import type { P21NodeBase, P21SyntaxKind } from '../ast/base';
import type {
  ComplexEntityInstanceNode,
  DataSectionNode,
  SimpleEntityInstanceNode,
  SimpleRecordNode,
} from '../ast/data';
import type { P21DocumentNode } from '../ast/document';
import type { HeaderEntityNode, HeaderSectionNode } from '../ast/header';
import type { ListNode, TypedParameterNode } from '../ast/parameter';
import type { ReferenceNode, ReferenceSectionNode } from '../ast/reference';
import type { SignatureSectionNode } from '../ast/signature';

export type VisitorAction = 'skip';

export interface P21Visitor {
  onP21Document?(node: P21DocumentNode): void | VisitorAction;
  onHeaderSection?(node: HeaderSectionNode): void | VisitorAction;
  onHeaderEntity?(node: HeaderEntityNode): void | VisitorAction;
  onDataSection?(node: DataSectionNode): void | VisitorAction;
  onSimpleEntityInstance?(node: SimpleEntityInstanceNode): void | VisitorAction;
  onComplexEntityInstance?(
    node: ComplexEntityInstanceNode,
  ): void | VisitorAction;
  onSimpleRecord?(node: SimpleRecordNode): void | VisitorAction;
  onTypedParameter?(node: TypedParameterNode): void | VisitorAction;
  onList?(node: ListNode): void | VisitorAction;
  onAnchorSection?(node: AnchorSectionNode): void | VisitorAction;
  onAnchor?(node: AnchorNode): void | VisitorAction;
  onAnchorTag?(node: AnchorTagNode): void | VisitorAction;
  onReferenceSection?(node: ReferenceSectionNode): void | VisitorAction;
  onReference?(node: ReferenceNode): void | VisitorAction;
  onSignatureSection?(node: SignatureSectionNode): void | VisitorAction;
  onNode?(kind: P21SyntaxKind, node: P21NodeBase): void | VisitorAction;
}
