# @step-nc/step-factory

Runtime instance engine for EXPRESS/STEP schemas. It creates, populates, and validates STEP entity instances from a resolved `ExpressSchema`.

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md). For package progress and milestones, see [ROADMAP.md](./ROADMAP.md).

## Minimal usage

```ts
import { StepModel, setAttribute, getAttribute } from '@step-nc/step-factory';

const model = new StepModel(schema);
const { instance } = model.createInstance('point');

setAttribute(instance!, 'x', 1.0);
setAttribute(instance!, 'y', 2.0);
setAttribute(instance!, 'z', 3.0);

console.log(getAttribute(instance!, 'x'));
```

## Main API surface

- `StepModel`: create/query/delete instances and polymorphic lookups.
- Attribute APIs: `setAttribute`, `setAttributes`, `getAttribute`, `getUnsetRequiredAttributes`.
- Derived APIs: `getDerivedAttribute`, `hasDerivedAttribute`.
- Aggregations: list/set/bag/array constructors and helpers.
- SELECT utilities: create/validate/read select values.
- Reference APIs: create/resolve refs and dangling-reference checks.
- Validation APIs: `validateInstance`, `validateModel`, where/unique validation.

## Expression interpreter

Includes an EXPRESS expression evaluator with arithmetic, logic, comparisons, and common built-ins used by derived attributes and validation rules.

## Diagnostics

Structured diagnostics include severity, code, and contextual metadata such as instance/entity/attribute identifiers.

## Dependencies

- `@step-nc/express-dictionary`
