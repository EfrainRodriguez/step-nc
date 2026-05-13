# @step-nc/p21-writer

Serializer from `StepModel` to ISO 10303-21 (Part 21) text. It exports runtime STEP models to `.stp` / `.p21` format for interoperability with CAD/CAM ecosystems.

For planned features, see [ROADMAP.md](./ROADMAP.md).

## Minimal usage

```ts
import { writeP21ToString } from '@step-nc/p21-writer';

const p21 = writeP21ToString(model);
console.log(p21);
```

## Main API

- `writeP21(model, options?)` -> returns `{ content, diagnostics }`.
- `writeP21ToString(model, options?)` -> convenience wrapper returning only the serialized string.

## Options

- `P21WriteOptions`
  - `header?: P21HeaderOptions`
  - `formatting?: P21FormattingOptions`

- `P21HeaderOptions`
  - File metadata (`fileName`, `author`, `organization`, `originatingSystem`, etc.)
  - Explicit schema list support

- `P21FormattingOptions`
  - `maxLineLength?: number`
  - `prettyPrint?: boolean`

## Advanced API

- `serializeAttributeValue(...)`
- `serializeInstance(...)`
- `serializeHeader(...)`
- `isComplexEntity(...)`

## Diagnostics

Writer diagnostics include warning/error codes such as unsupported values, encoding errors, missing attributes, and serialization warnings.

## Dependencies

- `@step-nc/step-factory`
- `@step-nc/express-dictionary`
