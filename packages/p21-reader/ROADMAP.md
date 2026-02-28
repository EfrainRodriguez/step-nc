# Roadmap del P21 Reader

## Estado actual

El paquete implementa la carga completa de archivos P21 en un `StepModel` usando un esquema EXPRESS resuelto.

| Componente | Responsabilidad | Estado |
|------------|-----------------|--------|
| `types.ts` | `P21ReadOptions`, `ReadResult` | ✅ Completo |
| `diagnostics.ts` | `ReaderDiagnostic`, códigos, helpers de severidad y formateo | ✅ Completo |
| `parameter-converter.ts` | Conversión ParameterNode → AttributeValue (primitivos, listas, refs, SELECT, constantes) | ✅ Completo |
| `entity-loader.ts` | Carga en dos fases, instancias simples y complejas (supertypes) | ✅ Completo |
| `resolve-refs.ts` | Resolución de refs placeholder en valores (ref, select, agregaciones) | ✅ Completo |
| `constants.ts` | Búsqueda de constantes en el schema | ✅ Completo |
| `read-p21.ts` | Punto de entrada, merge de diagnósticos, opción continueOnParseError | ✅ Completo |

### Tests

- Tests unitarios: diagnostics, parameter-converter, entity-loader (simple y complejo), read-p21, constants.
- Tests de integración: lectura + validación con schema real, referencias hacia adelante.

## Pipeline actual

```
texto P21 + ExpressSchema
  → parseP21()           [p21-parser]
  → loadEntities()       [dos fases: crear instancias, convertir params y resolver refs]
  → StepModel poblado + diagnostics
```

## Roadmap

### Fase 1 — Cobertura base (hecho)
**Prioridad: Alta | Estado: ✅**

- [x] Scaffold del paquete y configuración (tsup, vitest, dependencias).
- [x] Tipos y sistema de diagnósticos del reader.
- [x] Conversión de ParameterNode a AttributeValue (todos los casos del parser P21).
- [x] Carga de instancias simples y complejas en dos fases.
- [x] Resolución de referencias (forward refs).
- [x] Punto de entrada `readP21` y combinación de diagnósticos.
- [x] Lookup de constantes EXPRESS (sin evaluación).
- [x] Tests unitarios y de integración.

### Fase 2 — Constantes y valores derivados (futuro)
**Prioridad: Media | Esfuerzo: Medio**

- [ ] Evaluar constantes EXPRESS en tiempo de lectura cuando sea posible (expresiones simples) y reemplazar referencias a constantes por el valor resuelto en lugar de `INDETERMINATE`.
- [ ] Opción para no rellenar atributos DERIVED en la carga (dejarlos para evaluación lazy con el intérprete del step-factory) o documentar el comportamiento actual.

### Fase 3 — Robustez y opciones (futuro)
**Prioridad: Media | Esfuerzo: Bajo-Medio**

- [ ] Opción para ignorar parámetros extra (solo advertencia, sin fallar).
- [ ] Límites configurables (máximo de instancias o de profundidad de anidación) para archivos muy grandes.
- [ ] Mejora de mensajes de diagnóstico con línea/columna cuando el parser P21 las proporcione.

### Fase 4 — Escritura P21 (futuro, fuera de alcance actual)
**Prioridad: Baja**

- [ ] Paquete o módulo separado para serializar un `StepModel` a texto P21 (Part 21 writer), manteniendo el reader como solo-lectura.

## Resumen visual

```
┌─────────────────────────────────────────────────────────────┐
│                    readP21(source, schema)                   │
│                                                             │
│  source  ──►  parseP21()  ──►  AST (header + data sections)  │
│                                     │                        │
│                     continueOnParseError?                    │
│                                     │                        │
│              loadEntities()  ◄──────┘                        │
│                │                                              │
│                ├─ Phase 1: createInstanceWithId() × N        │
│                │                                              │
│                └─ Phase 2: convertParameter() + setAttribute   │
│                           resolveRefsInValue()               │
│                                     │                        │
│              StepModel  +  diagnostics (parse + reader)      │
└─────────────────────────────────────────────────────────────┘
```

La fase más costosa es la **Fase 2**: una pasada por cada instancia y cada atributo, más el recorrido de valores para resolver refs. Para archivos con muchas instancias, podría considerarse en el futuro un modo “lazy” de resolución de refs (resolver bajo demanda al acceder al atributo).
