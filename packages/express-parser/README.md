# @step-nc/express-parser

Parser de EXPRESS a AST tipado para uso en el ecosistema STEP-NC. Convierte texto EXPRESS en un árbol de sintaxis abstracta (AST) con tipos TypeScript y diagnósticos de lexer y parser.

Para entender la **arquitectura** del parser (pipeline, lexer, parser, AST y visitor), véase [ARCHITECTURE.md](./ARCHITECTURE.md).

## Uso mínimo

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

// AST raíz: un único schema (SchemaDeclarationNode)
const ast = result.ast;

// Diagnósticos (errores y advertencias de lexer y parser)
const diagnostics = result.diagnostics;
```

## API principal

- **`parseExpress(source, options?)`** — Parsea una cadena EXPRESS y devuelve un `ParseResult` con `ast` y `diagnostics`.
- **`ParseResult`** — `{ ast: SchemaDeclarationNode; diagnostics: ParseDiagnostic[] }`.
- **Tipos de nodos del AST** — Todos los nodos (declaraciones, expresiones, statements, tipos) se exportan como tipos desde el paquete (p. ej. `SchemaDeclarationNode`, `EntityDeclarationNode`, `TypeNode`, `ExpressionNode`).
- **`ParseOptions`** — Opciones del parser: `maxExplicitAttributes`, `maxEntitySectionItems`. Valores por defecto: `DEFAULT_MAX_EXPLICIT_ATTRIBUTES` y `DEFAULT_MAX_ENTITY_SECTION_ITEMS`.
- **Bases para narrowing** — `ASTNodeBase` (base de todos los nodos AST) y `TypeNodeBase` (base de nodos de tipo) para guards y helpers.
- **Lexer y utilidades** — `lexExpress`, `ParserContext`, helpers de span (`spanBetween`, `spanOfToken`, etc.) y tipos de tokens/diagnósticos según necesidad.

### Recorrido del AST

- **`visit(ast, visitor)`** — Recorrido en pre-order con handlers opcionales por tipo de nodo (`onSchemaDeclaration`, `onEntityDeclaration`, etc.). Retornar `'skip'` desde un handler para no visitar los hijos de ese nodo.
- **`walk(ast, callback, options?)`** — Recorrido de todos los nodos; orden `'pre'` (por defecto) o `'post'` según `options.order`.

Ejemplo con `visit` (listar entidades):

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

Ejemplo con `walk` (contar nodos):

```ts
import { parseExpress, walk } from '@step-nc/express-parser';

const result = parseExpress(source);
let count = 0;
walk(result.ast, () => count++);
console.log('Total nodes:', count);
```
