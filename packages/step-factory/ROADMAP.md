# Roadmap de step-factory

Alcance de este documento: el paquete **@step-nc/step-factory** (creación y gestión de instancias EXPRESS sobre un esquema cargado, validación, referencias, expresiones y reglas).

## Estado actual

El paquete implementa el ciclo completo: StepModel con instancias, atributos, agregaciones, SELECT, referencias, validación (instance/model, WHERE, Unique), intérprete de expresiones, atributos DERIVED con caché, multi-schema (SchemaRegistry), transacciones (begin/commit/rollback) y sistema de eventos tipados (instance:created, instance:deleted, attribute:changed, transaction:*).

| Versión | Alcance | Estado |
|---------|---------|--------|
| v0.1 | Scaffold, tipos (InstanceId, InstanceRef, SelectValue, StepAggregation), FactoryDiagnostic, StepModel, creación de instancias, getInstancesOf, atributos, agregaciones, SELECT, referencias, validación, helpers | ✅ Completo |
| v0.2 | Intérprete de expresiones, DERIVED (lazy), WHERE, Unique rules, multi-schema (USE/REFERENCE) | ✅ Completo |
| v0.2.1 | Funciones de usuario en expresiones, caché DERIVED con invalidación, EntityConstructor | ✅ Completo |
| v0.2.2 | Inversos cross-schema, operador LIKE (regex), límite de recursión UDF | ✅ Completo |
| v0.3 | Transacciones (snapshot, begin/commit/rollback), eventos (on/off, buffering durante transacciones) | ✅ Completo |

## Roadmap

### Fase 1 — v0.1 (base)
**Prioridad: Alta | Estado: ✅**

- [x] Package scaffold, build config, type system
- [x] InstanceId branded type, InstanceRef, SelectValue, StepAggregation types
- [x] FactoryDiagnostic system (error, warning, info) with helpers
- [x] StepModel class — single-schema population container
- [x] Instance creation with auto-increment IDs and explicit IDs
- [x] Abstract entity guard, unknown entity guard
- [x] Polymorphic instance queries (getInstancesOf with subtypes)
- [x] Attribute get/set with UPPERCASE normalization
- [x] Type-guard validation (isValueCompatible) for all TypeDescriptor kinds
- [x] Typed aggregations: LIST, SET, BAG, ARRAY with immutable operations
- [x] Aggregation bounds validation
- [x] SELECT types: createSelectValue, validateSelectValue
- [x] Inter-instance references: createRef, resolveRef, validateReferences
- [x] Instance-level validation (validateInstance)
- [x] Model-level validation (validateModel)
- [x] High-level helpers: createAndPopulate, cloneInstance, instanceToRecord
- [x] Integration tests with test-geometry.exp and SDAI-dictionary_schema.exp

### Fase 2 — v0.2 (expresiones y multi-schema)
**Prioridad: Alta | Estado: ✅**

- [x] Expression interpreter (arithmetic, comparisons, logical, built-in functions, QUERY)
- [x] DERIVED attribute computation (lazy evaluation, sin cache)
- [x] WHERE rules evaluation with expression interpreter
- [x] Unique rules validation across instances (hash-map approach)
- [x] Multi-schema support (USE/REFERENCE via SchemaRegistry, single StepModel)

### Fase 3 — v0.2.1 (UDF y caché)
**Prioridad: Alta | Estado: ✅**

- [x] User-defined function evaluation in expression interpreter
- [x] DERIVED attribute caching with invalidation
- [x] EntityConstructor support in expressions

### Fase 4 — v0.2.2 (inversos y LIKE)
**Prioridad: Media | Estado: ✅**

- [x] Cross-schema inverse attribute resolution
- [x] LIKE operator pattern matching (full regex support)
- [x] User-defined function recursion depth limit (currently unbounded)

### Fase 5 — v0.3 (transacciones y eventos)
**Prioridad: Alta | Estado: ✅**

- [x] Transactions (batch create/rollback con snapshot)
- [x] Observers/events (on instance created/deleted, attribute:changed, transaction:begin/commit/rollback; buffering durante transacciones)

## Más información

- **[README.md](./README.md)** — Uso y API del paquete.
