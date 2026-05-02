import type { P21NodeBase } from '../ast/base';
import { getChildren } from '../ast/children';
import type { P21DocumentNode } from '../ast/document';
import type { P21Visitor, VisitorAction } from './types';

const HANDLER_MAP: Partial<Record<P21NodeBase['type'], keyof P21Visitor>> = {
  P21Document: 'onP21Document',
  HeaderSection: 'onHeaderSection',
  HeaderEntity: 'onHeaderEntity',
  DataSection: 'onDataSection',
  SimpleEntityInstance: 'onSimpleEntityInstance',
  ComplexEntityInstance: 'onComplexEntityInstance',
  SimpleRecord: 'onSimpleRecord',
  TypedParameter: 'onTypedParameter',
  List: 'onList',
  AnchorSection: 'onAnchorSection',
  Anchor: 'onAnchor',
  AnchorTag: 'onAnchorTag',
  ReferenceSection: 'onReferenceSection',
  Reference: 'onReference',
  SignatureSection: 'onSignatureSection',
};

function visitNode(node: P21NodeBase, visitor: P21Visitor): void {
  const key = HANDLER_MAP[node.type];
  const handler = key
    ? (
        visitor as Record<
          string,
          ((n: P21NodeBase) => void | VisitorAction) | undefined
        >
      )[key]
    : undefined;

  let action: void | VisitorAction;
  if (typeof handler === 'function') {
    action = handler(node as never);
  } else {
    action = undefined;
  }

  if (visitor.onNode) {
    const genericAction = visitor.onNode(node.type, node);
    if (genericAction === 'skip') action = 'skip';
  }

  if (action === 'skip') return;

  const children = getChildren(node);
  for (const child of children) {
    visitNode(child, visitor);
  }
}

export function visit(ast: P21DocumentNode, visitor: P21Visitor): void {
  visitNode(ast as unknown as P21NodeBase, visitor);
}
