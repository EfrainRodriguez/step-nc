# Architecture - @step-nc/p21-reader

## Overview

`@step-nc/p21-reader` bridges textual P21 exchange data and runtime STEP instances. It parses P21 content, maps records to EXPRESS entities, resolves references, and produces a populated `StepModel`.

## Loading flow

1. Parse P21 source (`@step-nc/p21-parser`).
2. Inspect data sections and entity instances.
3. Create runtime instances (phase 1).
4. Map/assign attribute values and resolve references (phase 2).
5. Emit structured diagnostics.

## Core concerns

- Robust parameter-to-type conversion.
- Deferred reference resolution for forward references.
- Strict vs lenient behavior via reader options.
- Integration with runtime validation in `@step-nc/step-factory`.

## Design goals

- Predictable model loading.
- Clear and debuggable diagnostics.
- Compatibility with common P21 data patterns.
