import type { AnchorNode, AnchorSectionNode, AnchorTagNode } from './anchor';
import type { P21NodeBase } from './base';
import type {
  ComplexEntityInstanceNode,
  DataSectionNode,
  SimpleEntityInstanceNode,
  SimpleRecordNode,
} from './data';
import type { P21DocumentNode } from './document';
import type { HeaderEntityNode, HeaderSectionNode } from './header';
import type { ListNode, TypedParameterNode } from './parameter';
import type { ReferenceSectionNode } from './reference';

const EMPTY: readonly P21NodeBase[] = [];

export function getChildren(node: P21NodeBase): readonly P21NodeBase[] {
  switch (node.type) {
    case 'P21Document': {
      const n = node as unknown as P21DocumentNode;
      const out: P21NodeBase[] = [n.header];
      if (n.anchor) out.push(n.anchor);
      if (n.reference) out.push(n.reference);
      out.push(...n.data);
      out.push(...n.signatures);
      return out;
    }
    case 'HeaderSection':
      return [...(node as unknown as HeaderSectionNode).entities];
    case 'HeaderEntity':
      return [...(node as unknown as HeaderEntityNode).parameters];
    case 'DataSection':
      return [...(node as unknown as DataSectionNode).entities];
    case 'SimpleEntityInstance':
      return [(node as unknown as SimpleEntityInstanceNode).record];
    case 'ComplexEntityInstance':
      return [...(node as unknown as ComplexEntityInstanceNode).records];
    case 'SimpleRecord':
      return [...(node as unknown as SimpleRecordNode).parameters];
    case 'TypedParameter':
      return [(node as unknown as TypedParameterNode).parameter];
    case 'List':
      return [...(node as unknown as ListNode).items];
    case 'AnchorSection':
      return [...(node as unknown as AnchorSectionNode).anchors];
    case 'Anchor': {
      const n = node as unknown as AnchorNode;
      return [n.item, ...n.tags];
    }
    case 'AnchorTag':
      return [(node as unknown as AnchorTagNode).item];
    case 'ReferenceSection':
      return [...(node as unknown as ReferenceSectionNode).references];
    default:
      return EMPTY;
  }
}
