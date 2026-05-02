import type { InstanceId } from '@step-nc/step-factory';

export type ReaderDiagnosticSeverity = 'error' | 'warning' | 'info';

export type ReaderDiagnosticCode =
  | 'UNKNOWN_ENTITY'
  | 'ABSTRACT_ENTITY'
  | 'PARAMETER_TYPE_MISMATCH'
  | 'REQUIRED_ATTRIBUTE_MISSING'
  | 'EXTRA_PARAMETER'
  | 'DANGLING_ENTITY_REF'
  | 'DANGLING_VALUE_REF'
  | 'UNKNOWN_CONSTANT'
  | 'DUPLICATE_INSTANCE_ID'
  | 'INVALID_AGGREGATION';

export interface ReaderDiagnostic {
  readonly severity: ReaderDiagnosticSeverity;
  readonly code: ReaderDiagnosticCode;
  readonly message: string;
  readonly instanceId?: InstanceId;
  readonly entityName?: string;
  readonly attributeName?: string;
}

export function createReaderDiagnostic(
  severity: ReaderDiagnosticSeverity,
  code: ReaderDiagnosticCode,
  message: string,
  context?: {
    instanceId?: InstanceId;
    entityName?: string;
    attributeName?: string;
  },
): ReaderDiagnostic {
  return { severity, code, message, ...context };
}

export function errorDiag(
  code: ReaderDiagnosticCode,
  message: string,
  context?: {
    instanceId?: InstanceId;
    entityName?: string;
    attributeName?: string;
  },
): ReaderDiagnostic {
  return createReaderDiagnostic('error', code, message, context);
}

export function warningDiag(
  code: ReaderDiagnosticCode,
  message: string,
  context?: {
    instanceId?: InstanceId;
    entityName?: string;
    attributeName?: string;
  },
): ReaderDiagnostic {
  return createReaderDiagnostic('warning', code, message, context);
}

export function infoDiag(
  code: ReaderDiagnosticCode,
  message: string,
  context?: {
    instanceId?: InstanceId;
    entityName?: string;
    attributeName?: string;
  },
): ReaderDiagnostic {
  return createReaderDiagnostic('info', code, message, context);
}

export function hasReaderErrors(
  diagnostics: readonly ReaderDiagnostic[],
): boolean {
  return diagnostics.some((d) => d.severity === 'error');
}

export function filterBySeverity(
  diagnostics: readonly ReaderDiagnostic[],
  severity: ReaderDiagnosticSeverity,
): ReaderDiagnostic[] {
  return diagnostics.filter((d) => d.severity === severity);
}

export function formatReaderDiagnostic(diagnostic: ReaderDiagnostic): string {
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
