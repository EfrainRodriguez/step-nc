import type {
  ConstantDeclarationNode,
  EntityDeclarationNode,
  FunctionDeclarationNode,
  ProcedureDeclarationNode,
  RuleDeclarationNode,
  SchemaDeclarationNode,
  SubtypeConstraintDeclarationNode,
  TypeDeclarationNode,
} from '@step-nc/express-parser';
import type { SchemaDiagnostic } from '../diagnostics';
import { errorDiagnostic } from '../diagnostics';
import type {
  ConstantDefinition,
  FunctionDefinition,
  ProcedureDefinition,
  RuleDefinition,
} from '../types/callable';
import type { SubtypeConstraintDefinition } from '../types/constraint';
import type { EntityDefinition } from '../types/entity';
import type { ExpressSchema } from '../types/schema';
import type { TypeDefinition } from '../types/type-definition';
import { buildTypeDescriptor } from './type-descriptor-builder';

export interface CollectionResult {
  schema: ExpressSchema;
  diagnostics: SchemaDiagnostic[];
}

export function collectDeclarations(
  ast: SchemaDeclarationNode,
): CollectionResult {
  const diagnostics: SchemaDiagnostic[] = [];

  const schema: ExpressSchema = {
    name: ast.name,
    ...(ast.versionId !== undefined && { versionId: ast.versionId }),
    entities: new Map(),
    types: new Map(),
    functions: new Map(),
    procedures: new Map(),
    rules: new Map(),
    constants: new Map(),
    subtypeConstraints: new Map(),
    interfaces: ast.interfaces.map((iface) => ({
      kind:
        iface.type === 'UseClause' ? ('use' as const) : ('reference' as const),
      schemaName: iface.schemaName,
      ...(iface.items &&
        iface.items.length > 0 && {
          items: iface.items.map((item) => ({
            name: item.name,
            ...(item.alias !== undefined && { alias: item.alias }),
          })),
        }),
      span: iface.span,
    })),
    diagnostics: [],
  };

  for (const decl of ast.declarations) {
    switch (decl.type) {
      case 'EntityDeclaration':
        collectEntity(schema, decl, diagnostics);
        break;
      case 'TypeDeclaration':
        collectType(schema, decl, diagnostics);
        break;
      case 'FunctionDeclaration':
        collectFunction(schema, decl, diagnostics);
        break;
      case 'ProcedureDeclaration':
        collectProcedure(schema, decl, diagnostics);
        break;
      case 'RuleDeclaration':
        collectRule(schema, decl, diagnostics);
        break;
      case 'SubtypeConstraintDeclaration':
        collectSubtypeConstraint(schema, decl, diagnostics);
        break;
      case 'ConstantDeclaration':
        collectConstants(schema, decl, diagnostics);
        break;
    }
  }

  return { schema, diagnostics };
}

function registerWithDuplicateCheck<T extends { readonly name: string }>(
  map: Map<string, T>,
  item: T,
  kind: string,
  schemaName: string,
  diagnostics: SchemaDiagnostic[],
): void {
  const key = item.name.toUpperCase();
  if (map.has(key)) {
    diagnostics.push(
      errorDiagnostic(
        'DUPLICATE_DECLARATION',
        `Duplicate ${kind} declaration: "${item.name}"`,
        {
          schemaName,
          entityName: item.name,
        },
      ),
    );
    return;
  }
  map.set(key, item);
}

function collectEntity(
  schema: ExpressSchema,
  node: EntityDeclarationNode,
  diagnostics: SchemaDiagnostic[],
): void {
  const entity: EntityDefinition = {
    name: node.name,
    schema,
    abstract: node.abstract ?? false,
    supertypeNames: node.subtypeOf?.entities ?? [],
    supertypes: [],
    subtypes: [],
    explicitAttributes: [],
    derivedAttributes: [],
    inverseAttributes: [],
    uniqueRules: [],
    whereRules: [],
    instantiable: !(node.abstract ?? false),
  };

  // Expand ExplicitAttributeNode.names[] into individual ExplicitAttribute entries
  for (const attrNode of node.attributes) {
    for (const attrName of attrNode.names) {
      entity.explicitAttributes.push({
        name: attrName,
        parentEntity: entity,
        type: buildTypeDescriptor(attrNode.attributeType),
        optional: attrNode.optional ?? false,
      });
    }
  }

  if (node.derivedAttributes) {
    for (const derivedNode of node.derivedAttributes) {
      let redeclaredFrom:
        | { entityName: string; attributeName: string }
        | undefined;

      if (derivedNode.redeclaredAttr) {
        const qualifiers = derivedNode.redeclaredAttr.qualifiers;
        const groupQ = qualifiers[0];
        const attrQ = qualifiers[1];
        if (
          groupQ &&
          groupQ.type === 'GroupRef' &&
          attrQ &&
          attrQ.type === 'AttributeRef'
        ) {
          redeclaredFrom = {
            entityName: groupQ.name,
            attributeName: attrQ.name,
          };
        }
      }

      entity.derivedAttributes.push({
        name: derivedNode.name,
        parentEntity: entity,
        type: buildTypeDescriptor(derivedNode.attributeType),
        expression: derivedNode.expression,
        ...(redeclaredFrom ? { redeclaredFrom } : {}),
      });
    }
  }

  if (node.inverseAttributes) {
    for (const invNode of node.inverseAttributes) {
      entity.inverseAttributes.push({
        name: invNode.name,
        parentEntity: entity,
        type: buildTypeDescriptor(invNode.attributeType),
        invertedEntityName: invNode.invertedEntity,
        invertedAttributeName: invNode.invertedAttribute,
      });
    }
  }

  if (node.uniqueRules) {
    for (const ur of node.uniqueRules) {
      entity.uniqueRules.push({
        ...(ur.label !== undefined && { label: ur.label }),
        attributeNames: ur.attributes,
      });
    }
  }

  if (node.whereRules) {
    for (const wr of node.whereRules) {
      entity.whereRules.push({
        ...(wr.label !== undefined && { label: wr.label }),
        expression: wr.expression,
      });
    }
  }

  registerWithDuplicateCheck(
    schema.entities,
    entity,
    'entity',
    schema.name,
    diagnostics,
  );
}

function collectType(
  schema: ExpressSchema,
  node: TypeDeclarationNode,
  diagnostics: SchemaDiagnostic[],
): void {
  const typeDef: TypeDefinition = {
    name: node.name,
    schema,
    underlyingType: buildTypeDescriptor(node.underlyingType),
    whereRules: (node.whereRules ?? []).map((wr) => ({
      ...(wr.label !== undefined && { label: wr.label }),
      expression: wr.expression,
    })),
  };

  registerWithDuplicateCheck(
    schema.types,
    typeDef,
    'type',
    schema.name,
    diagnostics,
  );
}

function collectFunction(
  schema: ExpressSchema,
  node: FunctionDeclarationNode,
  diagnostics: SchemaDiagnostic[],
): void {
  const params = node.parameters.flatMap((p) =>
    p.names.map((name) => ({
      name,
      type: buildTypeDescriptor(p.parameterType),
      isVar: p.isVar ?? false,
    })),
  );

  const funcDef: FunctionDefinition = {
    name: node.name,
    schema,
    parameters: params,
    returnType: buildTypeDescriptor(node.returnType),
    ...(node.body.length > 0 && { body: node.body }),
    ...(node.declarations &&
      node.declarations.length > 0 && {
        localDeclarations: node.declarations,
      }),
  };

  registerWithDuplicateCheck(
    schema.functions,
    funcDef,
    'function',
    schema.name,
    diagnostics,
  );
}

function collectProcedure(
  schema: ExpressSchema,
  node: ProcedureDeclarationNode,
  diagnostics: SchemaDiagnostic[],
): void {
  const params = node.parameters.flatMap((p) =>
    p.names.map((name) => ({
      name,
      type: buildTypeDescriptor(p.parameterType),
      isVar: p.isVar ?? false,
    })),
  );

  const procDef: ProcedureDefinition = {
    name: node.name,
    schema,
    parameters: params,
  };

  registerWithDuplicateCheck(
    schema.procedures,
    procDef,
    'procedure',
    schema.name,
    diagnostics,
  );
}

function collectRule(
  schema: ExpressSchema,
  node: RuleDeclarationNode,
  diagnostics: SchemaDiagnostic[],
): void {
  const ruleDef: RuleDefinition = {
    name: node.name,
    schema,
    entityNames: node.entities,
    entities: [],
    whereRules: (node.whereRules ?? []).map((wr) => ({
      ...(wr.label !== undefined && { label: wr.label }),
      expression: wr.expression,
    })),
  };

  registerWithDuplicateCheck(
    schema.rules,
    ruleDef,
    'rule',
    schema.name,
    diagnostics,
  );
}

function collectSubtypeConstraint(
  schema: ExpressSchema,
  node: SubtypeConstraintDeclarationNode,
  diagnostics: SchemaDiagnostic[],
): void {
  const constraintDef: SubtypeConstraintDefinition = {
    name: node.name,
    entityName: node.entity,
    ...(node.abstractSupertype !== undefined && {
      abstractSupertype: node.abstractSupertype,
    }),
    ...(node.totalOver !== undefined && { totalOver: node.totalOver }),
  };

  registerWithDuplicateCheck(
    schema.subtypeConstraints,
    constraintDef,
    'subtype_constraint',
    schema.name,
    diagnostics,
  );
}

function collectConstants(
  schema: ExpressSchema,
  node: ConstantDeclarationNode,
  diagnostics: SchemaDiagnostic[],
): void {
  for (const constVal of node.constants) {
    const constDef: ConstantDefinition = {
      name: constVal.name,
      schema,
      type: buildTypeDescriptor(constVal.constantType),
      expression: constVal.expression,
    };

    registerWithDuplicateCheck(
      schema.constants,
      constDef,
      'constant',
      schema.name,
      diagnostics,
    );
  }
}
