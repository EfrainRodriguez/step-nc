# step-factory — Roadmap

## v0.1
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

## v0.2 (current)
- [x] Expression interpreter (arithmetic, comparisons, logical, built-in functions, QUERY)
- [x] DERIVED attribute computation (lazy evaluation, sin cache)
- [x] WHERE rules evaluation with expression interpreter
- [x] Unique rules validation across instances (hash-map approach)
- [x] Multi-schema support (USE/REFERENCE via SchemaRegistry, single StepModel)

## v0.2.1 (next)
- [ ] User-defined function evaluation in expression interpreter
- [ ] DERIVED attribute caching with invalidation
- [ ] EntityConstructor support in expressions

## v0.2.2 (future)
- [ ] Cross-schema inverse attribute resolution
- [ ] LIKE operator pattern matching (full regex support)

## v0.3 (future)
- [ ] Transactions (batch create/rollback)
- [ ] Observers/events (on instance created/deleted)
- [ ] Incremental serialization/deserialization
- [ ] Integration with p21-writer
