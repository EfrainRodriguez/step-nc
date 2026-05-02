# @step-nc/p21-reader

Lector de archivos P21 (ISO 10303-21 / Part 21). Carga datos P21 en un `StepModel` usando un esquema EXPRESS resuelto: mapea parámetros a atributos, resuelve referencias entre instancias y produce diagnósticos de lectura.

Para entender la **arquitectura** del reader (pipeline, conversión de parámetros, carga en dos fases), véase [ARCHITECTURE.md](./ARCHITECTURE.md). Para el **estado** y las **fases** del desarrollo, véase [ROADMAP.md](./ROADMAP.md).

## Uso mínimo

```ts
import { readP21 } from '@step-nc/p21-reader';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';

const expressSource = `…`; // texto EXPRESS del schema
const p21Source = `
ISO-10303-21;
HEADER;
FILE_DESCRIPTION((''), '2;1');
FILE_NAME('', '', (''), (''), '', '', '');
FILE_SCHEMA(('EXAMPLE_SCHEMA'));
ENDSEC;
DATA;
#1=POINT(1.0, 2.0, 3.0);
#2=LINE(#1, #1);
ENDSEC;
END-ISO-10303-21;
`;

const ast = parseExpress(expressSource).ast;
const { schema } = buildSchema(ast);
const { model, diagnostics } = readP21(p21Source, schema);

// model es un StepModel poblado con las instancias del DATA section
// diagnostics combina errores/advertencias del parser P21 y del reader
```

## API principal

- **`readP21(source, schema, options?)`** — Punto de entrada: parsea el texto P21, carga las instancias en un `StepModel` y devuelve el modelo junto con diagnósticos combinados (parser + reader).
- **`ReadResult`** — `{ model: StepModel; diagnostics: ReadonlyArray<P21ParseDiagnostic | ReaderDiagnostic> }`.
- **`P21ReadOptions`** — Opciones de lectura:
  - `continueOnParseError?: boolean` — Si es `true`, continúa cargando entidades aunque el parser haya reportado errores. Por defecto: `false`.
  - `strictRefs?: boolean` — Si es `true`, referencias colgantes producen error; si es `false`, advertencia. Por defecto: `true`.

### Tipos y diagnósticos

- **`ReaderDiagnostic`** — `{ severity, code, message, instanceId?, entityName?, attributeName? }`.
- **`ReaderDiagnosticCode`** — `UNKNOWN_ENTITY`, `ABSTRACT_ENTITY`, `PARAMETER_TYPE_MISMATCH`, `REQUIRED_ATTRIBUTE_MISSING`, `EXTRA_PARAMETER`, `DANGLING_ENTITY_REF`, `DANGLING_VALUE_REF`, `UNKNOWN_CONSTANT`, `DUPLICATE_INSTANCE_ID`, `INVALID_AGGREGATION`.
- **Helpers** — `createReaderDiagnostic`, `errorDiag`, `warningDiag`, `infoDiag`, `hasReaderErrors`, `filterBySeverity`, `formatReaderDiagnostic`.

### Conversión y carga (uso avanzado)

- **`convertParameter(param, typeDescriptor?, schema, context?)`** — Convierte un `ParameterNode` del parser P21 en un `AttributeValue` (primitivos, listas, refs, SELECT, etc.). Útil para integraciones o pruebas.
- **`loadEntities(dataSections, schema, model, strictRefs)`** — Carga las entidades de las secciones DATA en el modelo (dos fases: crear instancias, luego rellenar atributos y resolver refs). Normalmente se usa desde `readP21`.
- **`resolveRefsInValue(value, model, strictRefs, context, diagnostics)`** — Recorre un valor y reemplaza referencias placeholder (entityName vacío) por refs resueltas según el modelo.
- **`findConstant(name, schema)`** — Busca una constante por nombre en el schema (sin evaluar expresiones).

Ejemplo (validar modelo tras lectura):

```ts
import { readP21, hasReaderErrors } from '@step-nc/p21-reader';
import { validateModel } from '@step-nc/step-factory';

const { model, diagnostics } = readP21(p21Source, schema);

if (hasReaderErrors(diagnostics)) {
  console.error('Errores de lectura:', diagnostics.filter(d => d.severity === 'error'));
}

const modelDiags = validateModel(model);
if (modelDiags.length > 0) {
  console.warn('Validación del modelo:', modelDiags);
}
```

## Dependencias

- **@step-nc/p21-parser** — Parsea texto P21 en un AST (header + data sections).
- **@step-nc/express-dictionary** — Proporciona el `ExpressSchema` resuelto para mapear entidades y tipos.
- **@step-nc/step-factory** — `StepModel`, tipos de valores (`AttributeValue`, `InstanceRef`, etc.) y validación.
