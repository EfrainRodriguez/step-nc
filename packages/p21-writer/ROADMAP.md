# @step-nc/p21-writer — Roadmap

Funcionalidades Actuales:

- **Package scaffold + diagnostics + types**: Estructura del paquete, sistema de diagnósticos (WriterDiagnostic), interfaces de configuración (P21WriteOptions, P21HeaderOptions, etc.), abstracción P21Output
- **Value serializer**	Funciones puras para cada tipo: number (INTEGER vs REAL usando TypeDescriptor), string (escape P21), boolean (.T./.F.), null ($), INDETERMINATE (*), InstanceRef (#id), aggregations, SelectValue, Uint8Array (hex), enumeraciones (.VALUE.)
- **Instance serializer**	serializeInstance() — genera #id=ENTITY(params); respetando el orden de atributos heredados vía getAllAttributes(), manejo de DERIVED como *
-**Header serializer**	Genera la sección HEADER completa: FILE_DESCRIPTION, FILE_NAME, FILE_SCHEMA con defaults sensatos y soporte multi-schema
-	**Writer principal**	writeP21() y writeP21ToString() — orquestación completa con line wrapping, pretty print, sorting por ID, abstracción StringBufferOutput/CallbackOutput
-	**Integration tests + README**	Tests roundtrip (parse EXPRESS → build schema → populate model → serialize P21), tests con schemas reales, README en español

Funcionalidades futuras planificadas para el paquete de escritura P21.

## Fase 2: Streaming API

- [ ] **`writeP21ToStream`** — API de streaming con `CallbackOutput` para modelos grandes sin acumular el string completo en memoria. Útil para modelos con 100K+ instancias donde el string final podría exceder los límites de memoria.

## Fase 3: Anchor Sections

- [ ] Soporte para la sección ANCHOR de ISO 10303-21 Ed.3.
- [ ] Permite nombrar instancias con URIs para referenciado externo.
- [ ] Soporte para secciones del header  file population, section lenguaje y section context. ISO 10303-21
- [ ] Soporte para secciones del header definidas por el usuario 'user-defined'. ISO 10303-21

## Fase 4: Entity Mapping Hooks

- [ ] API de hooks user-defined para personalizar la serialización de entidades específicas.
- [ ] Permite transformaciones pre-serialización y post-procesamiento.

## Fase 5: P21 Comment Injection

- [ ] API para insertar comentarios `/* ... */` en posiciones específicas del output.
- [ ] Útil para documentación inline y debugging.

## Fase 6: Performance Benchmarks

- [ ] Suite de benchmarks con modelos de distintos tamaños (100, 1K, 10K, 100K instancias).
- [ ] Comparación de rendimiento entre `writeP21ToString` y futuro `writeP21ToStream`.
