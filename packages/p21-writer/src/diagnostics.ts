import type { InstanceId } from '@step-nc/step-factory';

export type WriterDiagnosticSeverity = 'error' | 'warning' | 'info';

export type WriterDiagnosticCode =
  | 'UNSUPPORTED_VALUE'
  | 'ENCODING_ERROR'
  | 'MISSING_ATTRIBUTE'
  | 'UNKNOWN_TYPE'
  | 'SERIALIZATION_WARNING';

export interface WriterDiagnostic {
  readonly severity: WriterDiagnosticSeverity;
  readonly code: WriterDiagnosticCode;
  readonly message: string;
  readonly instanceId?: InstanceId;
  readonly entityName?: string;
  readonly attributeName?: string;
}

export function createWriterDiagnostic(
  severity: WriterDiagnosticSeverity,
  code: WriterDiagnosticCode,
  message: string,
  context?: {
    instanceId?: InstanceId;
    entityName?: string;
    attributeName?: string;
  },
): WriterDiagnostic {
  return {
    severity,
    code,
    message,
    ...context,
  };
}

export function errorDiag(
  code: WriterDiagnosticCode,
  message: string,
  context?: {
    instanceId?: InstanceId;
    entityName?: string;
    attributeName?: string;
  },
): WriterDiagnostic {
  return createWriterDiagnostic('error', code, message, context);
}

export function warningDiag(
  code: WriterDiagnosticCode,
  message: string,
  context?: {
    instanceId?: InstanceId;
    entityName?: string;
    attributeName?: string;
  },
): WriterDiagnostic {
  return createWriterDiagnostic('warning', code, message, context);
}

export function infoDiag(
  code: WriterDiagnosticCode,
  message: string,
  context?: {
    instanceId?: InstanceId;
    entityName?: string;
    attributeName?: string;
  },
): WriterDiagnostic {
  return createWriterDiagnostic('info', code, message, context);
}

export function hasWriterErrors(
  diagnostics: readonly WriterDiagnostic[],
): boolean {
  return diagnostics.some((d) => d.severity === 'error');
}

export function filterBySeverity(
  diagnostics: readonly WriterDiagnostic[],
  severity: WriterDiagnosticSeverity,
): WriterDiagnostic[] {
  return diagnostics.filter((d) => d.severity === severity);
}

export function formatWriterDiagnostic(diagnostic: WriterDiagnostic): string {
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
