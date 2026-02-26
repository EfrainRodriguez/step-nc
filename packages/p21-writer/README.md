# @step-nc/p21-writer

Serializador de `StepModel` a archivos ISO-10303-21 (Part 21). Exporta modelos STEP construidos en runtime a formato `.stp`/`.p21` conforme al estándar, habilitando interoperabilidad con herramientas CAD/CAM externas.

Para funcionalidades futuras planificadas, véase [ROADMAP.md](./ROADMAP.md).

## Uso mínimo

```ts
import { parseExpress } from '@step-nc/express-parser';
import { buildSchema } from '@step-nc/express-dictionary';
import { StepModel, setAttribute } from '@step-nc/step-factory';
import { writeP21ToString } from '@step-nc/p21-writer';

const source = `
  SCHEMA example;
    TYPE length_measure = REAL;
    END_TYPE;
    ENTITY point;
      x, y, z : length_measure;
    END_ENTITY;
  END_SCHEMA;
`;

const ast = parseExpress(source).ast;
const { schema } = buildSchema(ast);

const model = new StepModel(schema);
const { instance } = model.createInstance('point');

setAttribute(instance!, 'x', 1.0, schema);
setAttribute(instance!, 'y', 2.0, schema);
setAttribute(instance!, 'z', 3.0, schema);

const p21 = writeP21ToString(model);
console.log(p21);
```

Produce:

```
ISO-10303-21;
HEADER;
FILE_DESCRIPTION((''),'2;1');
FILE_NAME('','2025-01-15T10:30:00',(''),(''),'','','');
FILE_SCHEMA(('EXAMPLE'));
ENDSEC;
DATA;
#1=POINT(1.,2.,3.);
ENDSEC;
END-ISO-10303-21;
```

## API principal

### `writeP21(model, options?): P21WriteResult`

Serializa un `StepModel` completo a formato P21. Retorna `{ content, diagnostics }`.

```ts
import { writeP21 } from '@step-nc/p21-writer';

const { content, diagnostics } = writeP21(model, {
  header: {
    fileName: 'output.stp',
    author: ['John Doe'],
    organization: ['ACME Inc.'],
    originatingSystem: 'My CAD System',
  },
});

if (diagnostics.length > 0) {
  console.warn('Warnings:', diagnostics);
}

fs.writeFileSync('output.stp', content);
```

### `writeP21ToString(model, options?): string`

Convenience wrapper que retorna solo el string P21 (sin diagnósticos).

```ts
import { writeP21ToString } from '@step-nc/p21-writer';
const p21 = writeP21ToString(model);
```

### `P21WriteOptions`

```ts
interface P21WriteOptions {
  header?: P21HeaderOptions;
  formatting?: P21FormattingOptions;
}
```

### `P21HeaderOptions`

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `description` | `string[]` | `['']` | Descripción del archivo |
| `implementationLevel` | `string` | `'2;1'` | Nivel de implementación P21 |
| `fileName` | `string` | `''` | Nombre del archivo |
| `timestamp` | `string` | ISO 8601 actual | Timestamp de creación |
| `author` | `string[]` | `['']` | Autores |
| `organization` | `string[]` | `['']` | Organizaciones |
| `preprocessorVersion` | `string` | `''` | Versión del preprocesador |
| `originatingSystem` | `string` | `''` | Sistema de origen |
| `authorization` | `string` | `''` | Autorización |
| `schemas` | `string[]` | `[model.schema.name]` | Schemas en FILE_SCHEMA |

### `P21FormattingOptions`

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `maxLineLength` | `number` | Sin límite | Longitud máxima de línea |
| `prettyPrint` | `boolean` | `false` | Formato con indentación |

## Soporte de complex entities

El writer detecta automáticamente entidades con herencia múltiple y las serializa en formato complejo P21:

```
#1=(LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.));
```

Cada entity type en la cadena de herencia aparece listado alfabéticamente, con solo sus propios atributos explícitos.

## API de bajo nivel

Para uso avanzado, las funciones de serialización individuales están exportadas:

- **`serializeAttributeValue(value, typeDescriptor?, schema?)`** — Serializa un `AttributeValue` individual.
- **`serializeInstance(instance, schema?)`** — Serializa una `EntityInstance` como data record P21.
- **`serializeHeader(options, schemaName)`** — Genera la sección HEADER.
- **`isComplexEntity(definition)`** — Detecta si una entidad requiere formato complejo.

## Diagnósticos

- **`WriterDiagnostic`** — `{ severity, code, message, instanceId?, entityName?, attributeName? }`.
- **`WriterDiagnosticCode`** — `UNSUPPORTED_VALUE`, `ENCODING_ERROR`, `MISSING_ATTRIBUTE`, `UNKNOWN_TYPE`, `SERIALIZATION_WARNING`.
- **Helpers** — `hasWriterErrors`, `filterBySeverity`, `formatWriterDiagnostic`, `errorDiag`, `warningDiag`, `infoDiag`.

## Dependencias

- **@step-nc/step-factory** — Provee `StepModel`, `EntityInstance`, `AttributeValue` y type guards.
- **@step-nc/express-dictionary** — Provee `EntityDefinition`, `ExpressSchema`, `TypeDescriptor` y query API.
