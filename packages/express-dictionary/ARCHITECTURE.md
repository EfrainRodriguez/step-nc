# Architecture - @step-nc/express-dictionary

## Overview

`@step-nc/express-dictionary` converts a syntactic EXPRESS AST into a semantic, queryable, and resolved in-memory schema model (`ExpressSchema`).

Input:
- `SchemaDeclarationNode` from `@step-nc/express-parser`

Output:
- `ExpressSchema`
- `SchemaDiagnostic[]`

## Pipeline

1. Normalize and index declarations.
2. Build entity/type definitions.
3. Resolve inheritance and attribute ownership.
4. Resolve inverse attributes and type references.
5. Validate consistency and emit diagnostics.

## Main components

- `buildSchema` -> entry point and orchestration.
- Schema builder layer -> materializes semantic definitions.
- Resolver layer -> links supertypes/subtypes, attributes, and type refs.
- Diagnostics layer -> structured error/warning reporting.
- `SchemaRegistry` -> multi-schema import resolution (`USE FROM`, `REFERENCE FROM`).

## Multi-schema model

`SchemaRegistry` allows you to register multiple schemas and resolve cross-schema imports in a dedicated phase. This keeps single-schema builds simple while supporting large standards split across multiple source files.

## Design goals

- Deterministic, reproducible schema builds.
- Clear and actionable diagnostics.
- Fast query helpers for downstream runtime packages.
- Strong typing for TypeScript consumers.
