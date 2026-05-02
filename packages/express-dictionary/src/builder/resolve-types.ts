import type { SchemaDiagnostic } from '../diagnostics';
import { errorDiagnostic } from '../diagnostics';
import type { EntityDefinition } from '../types/entity';
import type { ExpressSchema } from '../types/schema';
import type { TypeDefinition } from '../types/type-definition';
import type { SelectionItem, TypeDescriptor } from '../types/type-descriptor';

export type SymbolTable = Map<string, EntityDefinition | TypeDefinition>;

export function buildSymbolTable(schema: ExpressSchema): SymbolTable {
  const table: SymbolTable = new Map();
  for (const [key, entity] of schema.entities) {
    table.set(key, entity);
  }
  for (const [key, type] of schema.types) {
    table.set(key, type);
  }
  return table;
}

export function resolveTypes(schema: ExpressSchema): SchemaDiagnostic[] {
  const diagnostics: SchemaDiagnostic[] = [];
  const symbolTable = buildSymbolTable(schema);

  // Resolve entity attribute types
  for (const entity of schema.entities.values()) {
    for (const attr of entity.explicitAttributes) {
      attr.type = resolveDescriptor(
        attr.type,
        symbolTable,
        schema.name,
        entity.name,
        diagnostics,
      );
    }
    for (const attr of entity.derivedAttributes) {
      attr.type = resolveDescriptor(
        attr.type,
        symbolTable,
        schema.name,
        entity.name,
        diagnostics,
      );
    }
    for (const attr of entity.inverseAttributes) {
      attr.type = resolveDescriptor(
        attr.type,
        symbolTable,
        schema.name,
        entity.name,
        diagnostics,
      );
    }
  }

  // Resolve type definitions
  for (const typeDef of schema.types.values()) {
    typeDef.underlyingType = resolveDescriptor(
      typeDef.underlyingType,
      symbolTable,
      schema.name,
      typeDef.name,
      diagnostics,
    );
  }

  // Resolve function/procedure parameter types and return types
  for (const func of schema.functions.values()) {
    for (const param of func.parameters) {
      param.type = resolveDescriptor(
        param.type,
        symbolTable,
        schema.name,
        func.name,
        diagnostics,
      );
    }
    func.returnType = resolveDescriptor(
      func.returnType,
      symbolTable,
      schema.name,
      func.name,
      diagnostics,
    );
  }

  for (const proc of schema.procedures.values()) {
    for (const param of proc.parameters) {
      param.type = resolveDescriptor(
        param.type,
        symbolTable,
        schema.name,
        proc.name,
        diagnostics,
      );
    }
  }

  // Resolve constant types
  for (const constant of schema.constants.values()) {
    constant.type = resolveDescriptor(
      constant.type,
      symbolTable,
      schema.name,
      constant.name,
      diagnostics,
    );
  }

  return diagnostics;
}

function resolveDescriptor(
  descriptor: TypeDescriptor,
  symbolTable: SymbolTable,
  schemaName: string,
  contextName: string,
  diagnostics: SchemaDiagnostic[],
): TypeDescriptor {
  switch (descriptor.kind) {
    case 'unresolved': {
      const key = descriptor.name.toUpperCase();
      const resolved = symbolTable.get(key);
      if (!resolved) {
        diagnostics.push(
          errorDiagnostic(
            'UNRESOLVED_TYPE',
            `Type "${descriptor.name}" not found`,
            {
              schemaName,
              entityName: contextName,
              span: descriptor.span,
            },
          ),
        );
        return descriptor;
      }
      if (isEntityDefinition(resolved)) {
        return { kind: 'entity', entity: resolved };
      }
      return { kind: 'defined', definition: resolved };
    }

    case 'aggregation':
      return {
        ...descriptor,
        elementType: resolveDescriptor(
          descriptor.elementType,
          symbolTable,
          schemaName,
          contextName,
          diagnostics,
        ),
      };

    case 'select':
      return {
        ...descriptor,
        selections: descriptor.selections.map((sel) =>
          resolveSelectionItem(
            sel,
            symbolTable,
            schemaName,
            contextName,
            diagnostics,
          ),
        ),
      };

    default:
      return descriptor;
  }
}

function resolveSelectionItem(
  item: SelectionItem,
  symbolTable: SymbolTable,
  schemaName: string,
  contextName: string,
  diagnostics: SchemaDiagnostic[],
): SelectionItem {
  const key = item.name.toUpperCase();
  const resolved = symbolTable.get(key);
  if (!resolved) {
    diagnostics.push(
      errorDiagnostic(
        'UNRESOLVED_TYPE',
        `SELECT option "${item.name}" not found`,
        {
          schemaName,
          entityName: contextName,
        },
      ),
    );
    return item;
  }
  return { name: item.name, resolved };
}

function isEntityDefinition(
  sym: EntityDefinition | TypeDefinition,
): sym is EntityDefinition {
  return 'abstract' in sym && 'supertypes' in sym;
}
