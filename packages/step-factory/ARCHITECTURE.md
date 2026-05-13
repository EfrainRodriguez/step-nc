# Architecture - @step-nc/step-factory

## Overview

`@step-nc/step-factory` is the runtime model layer of the STEP-NC stack. It receives a resolved `ExpressSchema` and manages in-memory STEP instances, attributes, references, and validation.

## Data flow

1. Build or load a resolved schema.
2. Create a `StepModel` bound to that schema.
3. Create instances and assign values.
4. Resolve references and evaluate derived values.
5. Validate instances/model and collect diagnostics.

## Core layers

- Model layer (`StepModel`) for storage/indexing/lifecycle.
- Attribute layer for typed access and compatibility checks.
- Aggregation layer for immutable collection primitives.
- Reference layer for runtime links and resolution.
- Expression interpreter layer for derived/where logic.
- Validation layer for required/type/bounds/reference/where/unique checks.
- Diagnostics layer for consistent error and warning reporting.

## Notable design decisions

- Strong typing with branded IDs and discriminated unions.
- Polymorphic indexing to support subtype-aware queries.
- Deterministic behavior and explicit diagnostics over implicit coercion.
- Optional multi-schema support via `SchemaRegistry` integration.
