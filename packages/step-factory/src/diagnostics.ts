import type { InstanceId } from './types/values';

export type FactoryDiagnosticSeverity = 'error' | 'warning' | 'info';

export type FactoryDiagnosticCode =
  | 'ABSTRACT_INSTANTIATION'
  | 'UNKNOWN_ENTITY'
  | 'UNKNOWN_ATTRIBUTE'
  | 'TYPE_MISMATCH'
  | 'REQUIRED_ATTRIBUTE'
  | 'BOUNDS_VIOLATION'
  | 'INVALID_ENUM_VALUE'
  | 'INVALID_SELECT_PATH'
  | 'DUPLICATE_INSTANCE_ID'
  | 'DANGLING_REFERENCE';

export interface FactoryDiagnostic {
  readonly severity: FactoryDiagnosticSeverity;
  readonly code: FactoryDiagnosticCode;
  readonly message: string;
  readonly instanceId?: InstanceId;
  readonly entityName?: string;
  readonly attributeName?: string;
}

export function createFactoryDiagnostic(
  severity: FactoryDiagnosticSeverity,
  code: FactoryDiagnosticCode,
  message: string,
  context?: {
    instanceId?: InstanceId;
    entityName?: string;
    attributeName?: string;
  },
): FactoryDiagnostic {
  return {
    severity,
    code,
    message,
    ...context,
  };
}

export function errorDiag(
  code: FactoryDiagnosticCode,
  message: string,
  context?: {
    instanceId?: InstanceId;
    entityName?: string;
    attributeName?: string;
  },
): FactoryDiagnostic {
  return createFactoryDiagnostic('error', code, message, context);
}

export function warningDiag(
  code: FactoryDiagnosticCode,
  message: string,
  context?: {
    instanceId?: InstanceId;
    entityName?: string;
    attributeName?: string;
  },
): FactoryDiagnostic {
  return createFactoryDiagnostic('warning', code, message, context);
}

export function infoDiag(
  code: FactoryDiagnosticCode,
  message: string,
  context?: {
    instanceId?: InstanceId;
    entityName?: string;
    attributeName?: string;
  },
): FactoryDiagnostic {
  return createFactoryDiagnostic('info', code, message, context);
}

export function hasFactoryErrors(
  diagnostics: readonly FactoryDiagnostic[],
): boolean {
  return diagnostics.some((d) => d.severity === 'error');
}

export function filterBySeverity(
  diagnostics: readonly FactoryDiagnostic[],
  severity: FactoryDiagnosticSeverity,
): FactoryDiagnostic[] {
  return diagnostics.filter((d) => d.severity === severity);
}

export function formatFactoryDiagnostic(diagnostic: FactoryDiagnostic): string {
  const parts: string[] = [
    `[${diagnostic.severity.toUpperCase()}] ${diagnostic.code}: ${diagnostic.message}`,
  ];
  if (diagnostic.instanceId !== undefined) {
    parts.push(`  instance: #${diagnostic.instanceId}`);
  }
  if (diagnostic.entityName) {
    parts.push(`  entity: ${diagnostic.entityName}`);
  }
  if (diagnostic.attributeName) {
    parts.push(`  attribute: ${diagnostic.attributeName}`);
  }
  return parts.join('\n');
}
