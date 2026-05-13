# @step-nc/express-parser

Type-safe EXPRESS parser for the STEP-NC ecosystem. It converts EXPRESS text into a typed AST and reports lexer/parser diagnostics.

For parser architecture details (pipeline, lexer, parser, AST, visitor), see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Minimal usage

```ts
import { parseExpress } from '@step-nc/express-parser';

const source = `
  SCHEMA example;
    ENTITY point;
      x, y, z : REAL;
    END_ENTITY;
  END_SCHEMA;
`;

const result = parseExpress(source);
const ast = result.ast;
const diagnostics = result.diagnostics;
```

## Main API

- `parseExpress(source, options?)` -> parses EXPRESS text and returns `ParseResult`.
- `ParseResult` -> `{ ast: SchemaDeclarationNode; diagnostics: ParseDiagnostic[] }`.
- AST node types are exported (for example `SchemaDeclarationNode`, `EntityDeclarationNode`, `TypeNode`, `ExpressionNode`).
- `ParseOptions` -> parser limits like `maxExplicitAttributes` and `maxEntitySectionItems`.
- Base node types for narrowing: `ASTNodeBase`, `TypeNodeBase`.
- Low-level utilities are available (lexer, parser context, span helpers, token/diagnostic types).

## AST traversal

- `visit(ast, visitor)` -> pre-order traversal with per-node handlers. Return `'skip'` to skip children.
- `walk(ast, callback, options?)` -> visit all nodes in `'pre'` (default) or `'post'` order.

Example (`visit`):

```ts
import { parseExpress, visit } from '@step-nc/express-parser';

const result = parseExpress(source);
const names: string[] = [];

visit(result.ast, {
  onEntityDeclaration(node) {
    names.push(node.name);
  },
});
```

Example (`walk`):

```ts
import { parseExpress, walk } from '@step-nc/express-parser';

const result = parseExpress(source);
let count = 0;

walk(result.ast, () => count++);
console.log('Total nodes:', count);
```
