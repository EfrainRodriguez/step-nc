# @step-nc/step-factory

Motor de instancias runtime para EXPRESS/STEP. Crea, puebla y valida instancias de entidades STEP a partir de un `ExpressSchema` resuelto por `@step-nc/express-dictionary`.

Para entender la **arquitectura** del paquete (pipeline, StepModel, validación, agregaciones y helpers), véase [ARCHITECTURE.md](./ARCHITECTURE.md). Para el **estado** y las **fases** del desarrollo, véase [ROADMAP.md](./ROADMAP.md).

## Uso mínimo

```ts
import { parseExpress } from '@step-nc/express-parser';
import { buildSchema } from '@step-nc/express-dictionary';
import { StepModel, setAttribute, getAttribute } from '@step-nc/step-factory';

const source = `
  SCHEMA example;
    ENTITY point;
      x, y, z : REAL;
    END_ENTITY;
  END_SCHEMA;
`;

const ast = parseExpress(source).ast;
const { schema } = buildSchema(ast);

const model = new StepModel(schema);
const { instance } = model.createInstance('point');

setAttribute(instance!, 'x', 1.0);
setAttribute(instance!, 'y', 2.0);
setAttribute(instance!, 'z', 3.0);

getAttribute(instance!, 'x'); // 1.0
```

## API principal

- **`StepModel`** — Contenedor de instancias ligado a un `ExpressSchema`. Gestiona creación, consulta, eliminación y lookup polimórfico.
  - `new StepModel(schema, options?)` — Crea un modelo sobre un schema resuelto. `options.initialId` permite fijar el ID de arranque.
  - `createInstance(entityName)` / `createInstanceWithId(id, entityName)` — Crea una instancia con auto-increment o con un ID explícito. Devuelve `{ instance, diagnostics }`.
  - `getInstance(id)` — Obtiene una instancia por `InstanceId`.
  - `getAllInstances()` — Todas las instancias del modelo.
  - `getInstancesOf(entityName, includeSubtypes?)` — Instancias de una entidad, opcionalmente incluyendo subtipos (polimórfico).
  - `deleteInstance(id)` — Elimina una instancia y limpia los índices por tipo.
- **`CreateInstanceResult`** — `{ instance: EntityInstance | undefined; diagnostics: FactoryDiagnostic[] }`.

### Tipos core

- **`InstanceId`** — Tipo branded (`number & { __brand: 'InstanceId' }`). Usar `asInstanceId(n)` para convertir.
- **`EntityInstance`** — Instancia runtime: `id`, `typeName`, `definition`, `attributes` (Map) y `attributeDefinitions`.
- **`AttributeValue`** — Unión de todos los valores válidos: `number`, `string`, `boolean`, `null`, `Uint8Array`, `InstanceRef`, `StepAggregation`, `SelectValue`, `Indeterminate`.
- **`InstanceRef`** — Referencia a otra instancia: `{ kind: 'ref', id, entityName }`.
- **`SelectValue`** — Valor tipado SELECT: `{ kind: 'select', typePath, value }`.
- **`INDETERMINATE`** — Sentinel symbol para valores indeterminados (`?` en EXPRESS).
- **Type guards** — `isInstanceRef`, `isSelectValue`, `isStepAggregation`, `isIndeterminate`.

### Atributos

- **`getAttribute(instance, name)`** — Obtiene el valor de un atributo (normaliza a UPPERCASE).
- **`setAttribute(instance, name, value, schema?)`** — Asigna un valor; valida tipo si se pasa `schema`.
- **`setAttributes(instance, values, schema?)`** — Asigna múltiples atributos de golpe.
- **`hasAttribute(instance, name)`** — Comprueba si el atributo existe.
- **`getAttributeNames(instance)`** — Lista de nombres de atributo.
- **`getUnsetRequiredAttributes(instance)`** — Atributos obligatorios aún sin valor.
- **`isValueCompatible(typeDescriptor, value, schema)`** — Comprueba si un valor es compatible con un `TypeDescriptor`.
- **`getExpectedTypeName(typeDescriptor)`** — Nombre legible del tipo esperado.

### Agregaciones

Colecciones inmutables (`StepList`, `StepSet`, `StepBag`, `StepArray`):

- **`createList(elements)`**, **`createSet(elements)`**, **`createBag(elements)`**, **`createArray(lowerIndex, elements)`** — Constructores.
- **`addToAggregation(agg, value)`** — Devuelve una nueva agregación con el elemento añadido (sin mutar la original).
- **`removeFromAggregation(agg, index)`** — Devuelve una nueva agregación sin el elemento en `index`.
- **`aggregationSize(agg)`** / **`aggregationElements(agg)`** — Tamaño y elementos.
- **`validateAggregationBounds(agg, descriptor)`** — Valida contra los bounds del schema.

Ejemplo:

```ts
import { createList, addToAggregation, setAttribute } from '@step-nc/step-factory';

const coords = createList([1.0, 2.0, 3.0]);
const extended = addToAggregation(coords, 4.0);
setAttribute(instance, 'coordinates', extended);
```

### SELECT

- **`createSelectValue(typePath, value)`** — Crea un `SelectValue` con la ruta de tipos y el valor concreto.
- **`validateSelectValue(selectValue, descriptor, schema)`** — Valida que la ruta sea válida para el SELECT.
- **`getSelectActualValue(selectValue)`** — Extrae el valor concreto.
- **`getSelectTypePath(selectValue)`** — Obtiene la ruta de tipos.

### Referencias

- **`createRef(id, entityName)`** — Crea un `InstanceRef` hacia otra instancia.
- **`resolveRef(model, ref)`** — Resuelve la referencia a la instancia concreta.
- **`validateReferences(model)`** — Detecta todas las referencias colgantes del modelo.
- **`findReferencesTo(model, targetId)`** — Busca qué instancias/atributos apuntan a un ID dado.

Ejemplo:

```ts
import { createRef, setAttribute, resolveRef } from '@step-nc/step-factory';

const { instance: origin } = model.createInstance('cartesian_point');
const { instance: line } = model.createInstance('line');

const ref = createRef(origin!.id, 'cartesian_point');
setAttribute(line!, 'pnt', ref);

const resolved = resolveRef(model, ref); // → origin instance
```

### Validación

- **`validateInstance(instance, model)`** — Valida una instancia: atributos requeridos, compatibilidad de tipos, bounds de agregaciones, SELECT, y referencias colgantes.
- **`isInstanceComplete(instance)`** — `true` si todos los atributos requeridos tienen valor.
- **`validateModel(model)`** — Valida todas las instancias y las referencias cruzadas del modelo completo.

### Helpers

- **`createAndPopulate(model, entityName, attributes)`** — Crea una instancia y asigna atributos en un solo paso.
- **`cloneInstance(model, sourceId)`** — Crea una nueva instancia con los mismos valores que otra existente.
- **`instanceToRecord(instance)`** — Serializa una instancia a un plain object `{ id, typeName, attributes }`.

Ejemplo:

```ts
import { createAndPopulate, instanceToRecord } from '@step-nc/step-factory';

const { instance } = createAndPopulate(model, 'point', {
  x: 1.0,
  y: 2.0,
  z: 3.0,
});

const record = instanceToRecord(instance!);
// { id: 1, typeName: 'POINT', attributes: { X: 1.0, Y: 2.0, Z: 3.0 } }
```

### Diagnósticos

- **`FactoryDiagnostic`** — `{ severity, code, message, instanceId?, entityName?, attributeName? }`.
- **`FactoryDiagnosticCode`** — `ABSTRACT_INSTANTIATION`, `UNKNOWN_ENTITY`, `UNKNOWN_ATTRIBUTE`, `TYPE_MISMATCH`, `REQUIRED_ATTRIBUTE`, `BOUNDS_VIOLATION`, `INVALID_ENUM_VALUE`, `INVALID_SELECT_PATH`, `DUPLICATE_INSTANCE_ID`, `DANGLING_REFERENCE`.
- **`hasFactoryErrors(diagnostics)`** — `true` si hay errores.
- **`filterBySeverity(diagnostics, severity)`** — Filtra por severidad.
- **`formatFactoryDiagnostic(diagnostic)`** — Formatea un diagnóstico como string legible.
- **Helpers** — `errorDiag`, `warningDiag`, `infoDiag`, `createFactoryDiagnostic`.

## Dependencias

- **@step-nc/express-dictionary** — Se espera un `ExpressSchema` ya construido. El factory no parsea texto EXPRESS ni construye schemas.
- **@step-nc/express-parser** — Indirecta (a través de dictionary); se usa solo para tipos de nodos AST en los bounds de agregaciones.
