# Roadmap del parser P21

Alcance de este documento: solo el paquete **@step-nc/p21-parser** (tokenización y parsing P21 → AST). La integración con esquemas EXPRESS y el paso a un modelo de datos tipado (p. ej. StepModel) corresponde al paquete **@step-nc/p21-reader** y está descrita en su propio roadmap.

## Estado actual

### Lo que está completo

El paquete implementa el pipeline completo: lexer, parser, AST tipado, visitor y tests de integración con archivos .stp reales.

| Capa | Archivos clave | Estado |
|------|----------------|--------|
| **Lexer** | `lexer.ts`, `scanner.ts`, `context.ts`, `tables.ts`, `helpers.ts`, `types.ts` | ✅ Completo |
| **Parser** | `parser.ts`, `header.ts`, `data.ts`, `parameter.ts`, `anchor.ts`, `reference.ts`, `signature.ts`, `context.ts`, `common.ts` | ✅ Completo |
| **AST** | `base.ts`, `document.ts`, `header.ts`, `data.ts`, `parameter.ts`, `anchor.ts`, `reference.ts`, `signature.ts`, `children.ts` | ✅ Completo |
| **Visitor** | `visit.ts`, `walk.ts`, `types.ts` | ✅ Completo |
| **Tests** | Unitarios (lexer, parser por sección) + integración con .stp reales | ✅ Completo |

### Pipeline actual

```
source (string)
  → lexP21()     [implementado]
  → ParserContext + recursive descent
  → parseP21()   [implementado]
  → P21DocumentNode + P21ParseDiagnostic[]
```

## Conformance classes (ISO 10303-21)

| Clase | Descripción | Estado |
|-------|--------------|--------|
| CC1 | HEADER + DATA sections | ✅ Hecho |
| CC2 | Múltiples DATA sections | ✅ Hecho |
| CC3 | ANCHOR + REFERENCE sections | ✅ Hecho |
| CC4 | SIGNATURE sections | ✅ Hecho |

## Roadmap (alcance p21-parser)

### Fase 1 — Utilidades y calidad
**Prioridad: Media | Esfuerzo: Bajo-Medio**

- [ ] Utilidad opcional para decodificar directivas de control en cadenas P21 (`\X2\`, `\S\`, `\PA\`, etc.); hoy el contenido se captura como texto y la decodificación queda a cargo del consumidor.
- [ ] Pretty-printer / serializador: AST → texto P21 (round-trip y herramientas).
- [ ] Benchmarks de rendimiento para archivos grandes.

### Fase 2 — Modo streaming
**Prioridad: Baja | Esfuerzo: Alto**

- [ ] Parsing incremental o por streaming para archivos muy grandes sin cargar todo el contenido en memoria.

## Resumen visual del pipeline

```
┌─────────────────────────────────────────────────┐
│                parseP21(source)                  │
│                                                 │
│  source  ──►  lexP21()  ──►  P21Token[]         │
│                                    │            │
│                               ParserContext     │
│                                    │            │
│                            Recursive descent    │
│                            (header, data, …)    │
│                                    │            │
│                            P21DocumentNode      │
│                                    │            │
│                         P21ParseDiagnostic[]    │
└─────────────────────────────────────────────────┘
```

## Limitaciones conocidas

- **Directivas de control en cadenas:** El lexer captura el texto entre comillas tal cual; la decodificación de `\X2\`, `\S\`, `\PA\`, etc. se deja al consumidor.
- **SIGNATURE:** El contenido de las secciones SIGNATURE se captura como texto crudo; no se valida ni decodifica como BASE64.
- **Modo streaming:** No existe; el código fuente completo debe estar en memoria.
- **Posición final de tokens:** `tokenEnd` usa offset por longitud del texto; en tokens multilínea la posición final puede no ser exacta en línea/columna.

## Más información

- **[README.md](./README.md)** — Uso y API del paquete.
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Pipeline, capas, lexer, parser, AST y visitor.
