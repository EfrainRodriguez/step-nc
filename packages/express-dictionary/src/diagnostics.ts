import type { Span } from '@step-nc/express-parser';

export type SchemaDiagnosticSeverity = 'error' | 'warning' | 'info';

export type SchemaDiagnosticCode =
  | 'UNRESOLVED_TYPE'
  | 'CIRCULAR_INHERITANCE'
  | 'DUPLICATE_DECLARATION'
  | 'DUPLICATE_ATTRIBUTE'
  | 'UNRESOLVED_ENTITY_REF'
  | 'ABSTRACT_INSTANTIATION'
  | 'UNRESOLVED_SCHEMA_REF'
  | 'UNRESOLVED_INTERFACE_ITEM'
  | 'INVALID_INVERSE';

export interface SchemaDiagnostic {
  readonly severity: SchemaDiagnosticSeverity;
  readonly code: SchemaDiagnosticCode;
  readonly message: string;
  readonly schemaName?: string;
  readonly entityName?: string;
  readonly attributeName?: string;
  readonly span?: Span;
}

export function createDiagnostic(
  severity: SchemaDiagnosticSeverity,
  code: SchemaDiagnosticCode,
  message: string,
  context?: {
    schemaName?: string;
    entityName?: string;
    attributeName?: string;
    span?: Span;
  },
): SchemaDiagnostic {
  return {
    severity,
    code,
    message,
    ...context,
  };
}

export function errorDiagnostic(
  code: SchemaDiagnosticCode,
  message: string,
  context?: {
    schemaName?: string;
    entityName?: string;
    attributeName?: string;
    span?: Span;
  },
): SchemaDiagnostic {
  return createDiagnostic('error', code, message, context);
}

export function warningDiagnostic(
  code: SchemaDiagnosticCode,
  message: string,
  context?: {
    schemaName?: string;
    entityName?: string;
    attributeName?: string;
    span?: Span;
  },
): SchemaDiagnostic {
  return createDiagnostic('warning', code, message, context);
}

export function infoDiagnostic(
  code: SchemaDiagnosticCode,
  message: string,
  context?: {
    schemaName?: string;
    entityName?: string;
    attributeName?: string;
    span?: Span;
  },
): SchemaDiagnostic {
  return createDiagnostic('info', code, message, context);
}

export function filterBySeverity(
  diagnostics: readonly SchemaDiagnostic[],
  severity: SchemaDiagnosticSeverity,
): SchemaDiagnostic[] {
  return diagnostics.filter((d) => d.severity === severity);
}

export function hasErrors(diagnostics: readonly SchemaDiagnostic[]): boolean {
  return diagnostics.some((d) => d.severity === 'error');
}

export function formatDiagnostic(diagnostic: SchemaDiagnostic): string {
  const parts: string[] = [
    `[${diagnostic.severity.toUpperCase()}] ${diagnostic.code}: ${diagnostic.message}`,
  ];
  if (diagnostic.schemaName) {
    parts.push(`  schema: ${diagnostic.schemaName}`);
  }
  if (diagnostic.entityName) {
    parts.push(`  entity: ${diagnostic.entityName}`);
  }
  if (diagnostic.attributeName) {
    parts.push(`  attribute: ${diagnostic.attributeName}`);
  }
  if (diagnostic.span) {
    parts.push(
      `  at line ${diagnostic.span.start.line}:${diagnostic.span.start.column}`,
    );
  }
  return parts.join('\n');
}
