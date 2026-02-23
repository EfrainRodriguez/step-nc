import type { ASTNodeBase } from '../ast/base';
import type { SchemaDeclarationNode } from '../ast/declarations';
import { getChildren } from '../ast/children';

export interface WalkOptions {
  order?: 'pre' | 'post';
}

/**
 * Walks the entire AST, invoking the callback once per node. Root and all descendants are visited.
 *
 * @param ast - Root schema node
 * @param callback - Called for each node (pre-order or post-order depending on options)
 * @param options.order - 'pre' (default): callback before children; 'post': callback after children
 *
 * @example
 * let n = 0;
 * walk(ast, () => n++);
 * console.log('Total nodes:', n);
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
