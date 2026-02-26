// ── Types ────────────────────────────────────────────────────────────
export type {
  P21FormattingOptions,
  P21HeaderOptions,
  P21WriteOptions,
  P21WriteResult,
} from './types';

// ── Diagnostics ──────────────────────────────────────────────────────
export {
  createWriterDiagnostic,
  errorDiag,
  filterBySeverity,
  formatWriterDiagnostic,
  hasWriterErrors,
  infoDiag,
  warningDiag,
} from './diagnostics';
export type {
  WriterDiagnostic,
  WriterDiagnosticCode,
  WriterDiagnosticSeverity,
} from './diagnostics';

// ── Writer ───────────────────────────────────────────────────────────
export { writeP21, writeP21ToString } from './write-p21';

// ── Serialization (advanced / low-level) ─────────────────────────────
export { serializeHeader } from './serialize-header';
export { isComplexEntity, serializeInstance } from './serialize-instance';
export { serializeAttributeValue } from './serialize-value';
