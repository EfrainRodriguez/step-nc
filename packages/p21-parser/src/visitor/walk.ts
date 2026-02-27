import type { P21NodeBase } from '../ast/base';
import { getChildren } from '../ast/children';
import type { P21DocumentNode } from '../ast/document';

export interface WalkOptions {
  order?: 'pre' | 'post';
}

export function walk(
  ast: P21DocumentNode,
  callback: (node: P21NodeBase) => void,
  options?: WalkOptions,
): void {
  const order = options?.order ?? 'pre';

  function walkNode(node: P21NodeBase): void {
    if (order === 'pre') callback(node);
    const children = getChildren(node);
    for (const child of children) {
      walkNode(child);
    }
    if (order === 'post') callback(node);
  }

  walkNode(ast as unknown as P21NodeBase);
}
