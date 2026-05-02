# @step-nc/p21-parser

Parser sin dependencias para archivos **ISO 10303-21** (STEP Part 21). Tokeniza y parsea el exchange structure en un AST tipado (`P21DocumentNode`) con diagnósticos y posiciones de fuente completas.

Para la **arquitectura** del paquete (pipeline, lexer, parser, AST y visitor), véase [ARCHITECTURE.md](./ARCHITECTURE.md). Para el **estado** y el **roadmap**, véase [ROADMAP.md](./ROADMAP.md).

## Uso mínimo

```ts
import { parseP21 } from '@step-nc/p21-parser';

const source = `
ISO-10303-21;
HEADER;
  FILE_DESCRIPTION(('Example'), '2;1');
ENDSEC;
DATA;
  #1 = CARTESIAN_POINT('Origin', 0.0, 0.0, 0.0);
ENDSEC;
END-ISO-10303-21;
`;

const result = parseP21(source);

// AST raíz: documento P21 con header, data, etc.
const ast = result.ast;

// Diagnósticos (errores y advertencias de lexer y parser)
const diagnostics = result.diagnostics;
```

## API principal

- **`parseP21(source, options?)`** — Parsea una cadena P21 y devuelve un `ParseResult` con `ast` (raíz `P21DocumentNode`) y `diagnostics`.
- **`lexP21(source)`** — Solo tokenización; devuelve `LexResult` con `tokens` y `diagnostics` de lexer.
- **`ParseResult`** — `{ ast: P21DocumentNode; diagnostics: P21ParseDiagnostic[] }`.
- **`LexResult`** — `{ tokens: P21Token[]; diagnostics: P21LexDiagnostic[] }`.
- **Tipos del AST** — Todos los nodos se exportan: `P21DocumentNode`, `HeaderSectionNode`, `DataSectionNode`, `EntityInstanceNode`, `ParameterNode`, `AnchorSectionNode`, `ReferenceSectionNode`, `SignatureSectionNode`, etc. Cada nodo tiene `type`, `span` (posición en el texto) y campos específicos.
- **Helpers de span** — `tokenStart`, `tokenEnd`, `spanBetween`, `spanOfToken`, `spanFromTokens` para construir spans desde tokens.
- **`ParserContext`** — Contexto del parser (tokens, posición, `consume`, `expect`, etc.) para uso avanzado.
- **`getChildren(node)`** — Devuelve los hijos de un nodo del AST para recorridos manuales.

### Recorrido del AST

- **`visit(ast, visitor)`** — Recorrido en pre-order con handlers opcionales por tipo de nodo (`onP21Document`, `onHeaderSection`, `onDataSection`, `onSimpleEntityInstance`, etc.). Retornar `'skip'` para no visitar los hijos de ese nodo.
- **`walk(ast, callback, options?)`** — Recorrido de todos los nodos; orden `'pre'` (por defecto) o `'post'` según `options.order`.

Ejemplo con `visit` (listar instancias de entidad en DATA):

```ts
import { parseP21, visit } from '@step-nc/p21-parser';

const result = parseP21(source);
const ids: number[] = [];
visit(result.ast, {
  onSimpleEntityInstance(node) {
    ids.push(node.id);
  },
  onComplexEntityInstance(node) {
    ids.push(node.id);
  },
});
```

Ejemplo con `walk` (contar nodos):

```ts
import { parseP21, walk } from '@step-nc/p21-parser';

const result = parseP21(source);
let count = 0;
walk(result.ast, () => count++);
console.log('Total nodes:', count);
```

## Conformance classes (ISO 10303-21)

El parser soporta las cuatro clases de conformidad:

| Clase | Secciones | Estado |
|-------|------------|--------|
| CC1   | HEADER + DATA | ✅ |
| CC2   | Múltiples DATA | ✅ |
| CC3   | ANCHOR + REFERENCE | ✅ |
| CC4   | SIGNATURE | ✅ |

## Requisitos

- Node.js >= 20
- TypeScript 5.x (para desarrollo)

## Scripts

```bash
pnpm --filter @step-nc/p21-parser build    # Compilar
pnpm --filter @step-nc/p21-parser test     # Tests
pnpm --filter @step-nc/p21-parser coverage # Cobertura
pnpm --filter @step-nc/p21-parser clean    # Borrar dist
```
