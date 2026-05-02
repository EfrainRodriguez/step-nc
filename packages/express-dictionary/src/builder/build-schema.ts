import type { SchemaDeclarationNode } from '@step-nc/express-parser';
import type { SchemaDiagnostic } from '../diagnostics';
import type { SchemaRegistry } from '../registry/schema-registry';
import type { ExpressSchema } from '../types/schema';
import { buildInheritance } from './build-inheritance';
import { collectDeclarations } from './collect-declarations';
import { resolveConstraints } from './resolve-constraints';
import { resolveInverse } from './resolve-inverse';
import { resolveTypes } from './resolve-types';

export interface BuildSchemaOptions {
  registry?: SchemaRegistry;
}

export interface BuildSchemaResult {
  schema: ExpressSchema;
  diagnostics: SchemaDiagnostic[];
}

/**
 * Transforms a parsed EXPRESS AST into a resolved, linked semantic schema.
 * This is the main entry point for the package.
 */
export function buildSchema(
  ast: SchemaDeclarationNode,
  options?: BuildSchemaOptions,
): BuildSchemaResult {
  const diagnostics: SchemaDiagnostic[] = [];

  // Phase 1: Collect declarations
  const { schema, diagnostics: collectDiags } = collectDeclarations(ast);
  diagnostics.push(...collectDiags);

  // Phase 2: Resolve types
  const resolveDiags = resolveTypes(schema);
  diagnostics.push(...resolveDiags);

  // Phase 3: Build inheritance hierarchy
  const inheritDiags = buildInheritance(schema);
  diagnostics.push(...inheritDiags);

  // Phase 4: Resolve inverse attributes
  const inverseDiags = resolveInverse(schema);
  diagnostics.push(...inverseDiags);

  // Phase 5: Resolve constraints (unique/where rules)
  const constraintDiags = resolveConstraints(schema);
  diagnostics.push(...constraintDiags);

  // Phase 6: Register with registry and resolve interfaces if provided
  if (options?.registry) {
    options.registry.register(schema);
    const interfaceDiags = options.registry.resolveInterfaces();
    diagnostics.push(...interfaceDiags);
  }

  schema.diagnostics = diagnostics;

  return { schema, diagnostics };
}
