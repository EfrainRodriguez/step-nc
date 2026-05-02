import type { SchemaDeclarationNode } from '@step-nc/express-parser';
import { buildInheritance } from '../builder/build-inheritance';
import { collectDeclarations } from '../builder/collect-declarations';
import { resolveConstraints } from '../builder/resolve-constraints';
import { resolveInverse } from '../builder/resolve-inverse';
import { resolveTypes } from '../builder/resolve-types';
import type { SchemaDiagnostic } from '../diagnostics';
import type { ExpressSchema } from '../types/schema';
import { resolveInterfaces } from './resolve-interfaces';

export interface BuildResult {
  schema: ExpressSchema;
  diagnostics: SchemaDiagnostic[];
}

export class SchemaRegistry {
  private schemas: Map<string, ExpressSchema> = new Map();

  register(schema: ExpressSchema): void {
    const key = schema.name.toUpperCase();
    this.schemas.set(key, schema);
  }

  buildAndRegister(ast: SchemaDeclarationNode): BuildResult {
    const { schema, diagnostics: collectDiags } = collectDeclarations(ast);
    const resolveDiags = resolveTypes(schema);
    const inheritDiags = buildInheritance(schema);
    const inverseDiags = resolveInverse(schema);
    const constraintDiags = resolveConstraints(schema);

    this.register(schema);

    return {
      schema,
      diagnostics: [
        ...collectDiags,
        ...resolveDiags,
        ...inheritDiags,
        ...inverseDiags,
        ...constraintDiags,
      ],
    };
  }

  get(name: string): ExpressSchema | undefined {
    return this.schemas.get(name.toUpperCase());
  }

  resolveInterfaces(): SchemaDiagnostic[] {
    return resolveInterfaces(this.schemas);
  }

  list(): ExpressSchema[] {
    return [...this.schemas.values()];
  }

  get size(): number {
    return this.schemas.size;
  }
}
