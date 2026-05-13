# @step-nc/express-dictionary

Builds a semantic dictionary (resolved and linked model) from an EXPRESS AST. It transforms the AST produced by `@step-nc/express-parser` into an `ExpressSchema` with resolved entities, types, attributes, inheritance, and inverses.

For package architecture details (pipeline, builder, registry, query API), see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Minimal usage

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
```

## Main API

- `buildSchema(ast, options?)` -> converts `SchemaDeclarationNode` into a resolved `ExpressSchema`.
- `BuildSchemaResult` -> `{ schema: ExpressSchema; diagnostics: SchemaDiagnostic[] }`.
- `SchemaRegistry` -> multi-schema support (`buildAndRegister`, `get`, `list`, `resolveInterfaces`).
- Semantic model types are exported (`EntityDefinition`, `TypeDefinition`, `TypeDescriptor`, etc.).
- Diagnostics helpers are exported (`formatDiagnostic`, `hasErrors`, `filterBySeverity`, etc.).

## Query API

- Schema lookups: `getEntity`, `getType`, `getNamedType`, `getAllEntities`, `getAllTypes`, `getInstantiableEntities`.
- Entity utilities: `getOwnAttributes`, `getInheritedAttributes`, `getAllAttributes`, `getDirectSubtypes`, `getAllSubtypes`, `getSupertypeChain`, `isSubtypeOf`, `isInstantiable`.
- Type utilities: `isSimpleType`, `isEntityType`, `isSelectType`, `isEnumerationType`, `isAggregationType`, `getSelectOptions`, `resolveToBaseType`.

## Dependencies

- `@step-nc/express-parser` (expects a pre-parsed AST; this package does not parse EXPRESS text).
