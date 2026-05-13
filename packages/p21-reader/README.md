# @step-nc/p21-reader

Reader for P21 files (ISO 10303-21 / Part 21). It loads P21 data into a `StepModel` using a resolved EXPRESS schema: maps parameters to attributes, resolves instance references, and reports reader diagnostics.

For package architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md). For status and milestones, see [ROADMAP.md](./ROADMAP.md).

## Minimal usage

```ts
import { readP21 } from '@step-nc/p21-reader';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';

const expressSource = `...`;
const p21Source = `...`;

const ast = parseExpress(expressSource).ast;
const { schema } = buildSchema(ast);
const { model, diagnostics } = readP21(p21Source, schema);
```

## Main API

- `readP21(source, schema, options?)` -> parses + loads entities into `StepModel`.
- `ReadResult` -> `{ model: StepModel; diagnostics: ReadonlyArray<P21ParseDiagnostic | ReaderDiagnostic> }`.
- `P21ReadOptions`:
  - `continueOnParseError?: boolean`
  - `strictRefs?: boolean`

## Advanced utilities

- `convertParameter(...)` -> convert parser parameters to runtime values.
- `loadEntities(...)` -> two-phase data loading.
- `resolveRefsInValue(...)` -> placeholder reference resolution.
- `findConstant(...)` -> schema constant lookup.

## Dependencies

- `@step-nc/p21-parser`
- `@step-nc/express-dictionary`
- `@step-nc/step-factory`
