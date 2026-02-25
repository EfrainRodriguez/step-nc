# step-factory — Roadmap

## v0.1 (current)
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

## v0.2 (future)
- [ ] Multi-schema support (USE/REFERENCE between schemas)
- [ ] Unique rules validation across instances
- [ ] WHERE rules evaluation with expression interpreter
- [ ] DERIVED attribute computation

## v0.3 (future)
- [ ] Transactions (batch create/rollback)
- [ ] Observers/events (on instance created/deleted)
- [ ] Incremental serialization/deserialization
- [ ] Integration with p21-writer
