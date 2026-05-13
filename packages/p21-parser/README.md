# @step-nc/p21-parser

Zero-dependency parser for **ISO 10303-21** (STEP Part 21) exchange files. It tokenizes and parses exchange structures into a typed AST (`P21DocumentNode`) with full source-position diagnostics.

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md). For package status and milestones, see [ROADMAP.md](./ROADMAP.md).

## Minimal usage

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
const ast = result.ast;
const diagnostics = result.diagnostics;
```

## Main API

- `parseP21(source, options?)` -> returns `{ ast, diagnostics }`.
- `lexP21(source)` -> lexer-only pass.
- AST node types are exported (`P21DocumentNode`, `HeaderSectionNode`, `DataSectionNode`, `EntityInstanceNode`, etc.).
- Span/token helpers are exported for tooling and advanced integrations.
- `ParserContext` and `getChildren(node)` are available for advanced scenarios.

## AST traversal

- `visit(ast, visitor)` -> pre-order visitor with typed handlers.
- `walk(ast, callback, options?)` -> generic traversal in pre/post order.

## Conformance classes

The parser targets all four ISO 10303-21 conformance classes:

| Class | Sections | Status |
|-------|----------|--------|
| CC1 | HEADER + DATA | ✅ |
| CC2 | Multiple DATA sections | ✅ |
| CC3 | ANCHOR + REFERENCE | ✅ |
| CC4 | SIGNATURE | ✅ |
