import type { ASTNodeBase } from '../ast/base';
import type { SchemaDeclarationNode } from '../ast/declarations';
import { getChildren } from '../ast/children';

export interface WalkOptions {
  order?: 'pre' | 'post';
}

/**
 * Walks the entire AST, invoking the callback for each node.
 * Default order is pre-order; set options.order to 'post' for post-order.
 */
export function walk(
  ast: SchemaDeclarationNode,
  callback: (node: ASTNodeBase) => void,
  options?: WalkOptions,
): void {
  const order = options?.order ?? 'pre';

  function walkNode(node: ASTNodeBase): void {
    if (order === 'pre') callback(node);
    const children = getChildren(node);
    for (const child of children) {
      walkNode(child);
    }
    if (order === 'post') callback(node);
  }

  walkNode(ast);
}
