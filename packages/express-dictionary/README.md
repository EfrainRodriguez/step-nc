# @step-nc/express-dictionary

Construye un diccionario semántico (modelo resuelto y enlazado) a partir del AST de EXPRESS. Toma el árbol de sintaxis abstracta producido por `@step-nc/express-parser` y lo transforma en un `ExpressSchema` con entidades, tipos, atributos, herencia e inversos resueltos, listo para consultas y uso en el ecosistema STEP-NC.

Para entender la **arquitectura** del paquete (pipeline, builder, registry, API de consulta), véase [ARCHITECTURE.md](./ARCHITECTURE.md).

## Uso mínimo

```ts
import { parseExpress } from '@step-nc/express-parser';
import { buildSchema } from '@step-nc/express-dictionary';

const source = `
  SCHEMA example;
    ENTITY point;
      x, y, z : REAL;
    END_ENTITY;
  END_SCHEMA;
`;

const parseResult = parseExpress(source);
const { schema, diagnostics } = buildSchema(parseResult.ast);

// Schema resuelto: entidades y tipos por nombre
const point = schema.entities.get('POINT');
// Consultas por API
import { getEntity, getOwnAttributes } from '@step-nc/express-dictionary';
const entity = getEntity(schema, 'point');
const attrs = getOwnAttributes(entity!);
```

## API principal

- **`buildSchema(ast, options?)`** — Punto de entrada: transforma un `SchemaDeclarationNode` (AST) en un `ExpressSchema` resuelto. Opcionalmente recibe un `SchemaRegistry` para multi-schema y resolución de USE/REFERENCE.
- **`BuildSchemaResult`** — `{ schema: ExpressSchema; diagnostics: SchemaDiagnostic[] }`.
- **`SchemaRegistry`** — Registro de varios esquemas; `buildAndRegister(ast)`, `get(name)`, `list()`, `resolveInterfaces()` para resolver cláusulas USE/REFERENCE entre esquemas.
- **Tipos del modelo semántico** — `ExpressSchema`, `EntityDefinition`, `TypeDefinition`, `ExplicitAttribute`, `TypeDescriptor`, etc., exportados desde el paquete.
- **Diagnósticos** — `SchemaDiagnostic`, `formatDiagnostic`, `createDiagnostic`, `errorDiagnostic`, `warningDiagnostic`, `hasErrors`, `filterBySeverity`.

### API de consulta

- **Schema:** `getEntity(schema, name)`, `getType(schema, name)`, `getNamedType(schema, name)`, `getAllEntities`, `getAllTypes`, `getInstantiableEntities`.
- **Entidad:** `getOwnAttributes`, `getInheritedAttributes`, `getAllAttributes`, `getAllDerivedAttributes`, `getAllInverseAttributes`, `getDirectSubtypes`, `getAllSubtypes`, `getSupertypeChain`, `isSubtypeOf`, `isInstantiable`.
- **Tipo:** `isSimpleType`, `isEntityType`, `isSelectType`, `isEnumerationType`, `isAggregationType`, `getSelectOptions`, `resolveToBaseType`.

Ejemplo (listar atributos y subtipos):

```ts
import {
  buildSchema,
  getEntity,
  getOwnAttributes,
  getDirectSubtypes,
} from '@step-nc/express-dictionary';

const { schema } = buildSchema(ast);
const entity = getEntity(schema, 'geometric_representation_item');
if (entity) {
  const attrs = getOwnAttributes(entity);
  const subtypes = getDirectSubtypes(entity);
}
```

Ejemplo (multi-schema con registry):

```ts
import { parseExpress } from '@step-nc/express-parser';
import { buildSchema, SchemaRegistry } from '@step-nc/express-dictionary';

const registry = new SchemaRegistry();
const ast1 = parseExpress(source1).ast;
const ast2 = parseExpress(source2).ast;

const r1 = buildSchema(ast1, { registry });
const r2 = buildSchema(ast2, { registry });
const interfaceDiags = registry.resolveInterfaces();

const schemaA = registry.get('schema_a');
```

## Dependencias

- **@step-nc/express-parser** — Se espera un AST ya parseado (`SchemaDeclarationNode`). El diccionario no parsea texto EXPRESS.
