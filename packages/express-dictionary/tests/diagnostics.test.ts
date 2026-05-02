import { describe, expect, it } from 'vitest';
import type { SchemaDiagnostic } from '../src/diagnostics';
import {
  createDiagnostic,
  errorDiagnostic,
  filterBySeverity,
  formatDiagnostic,
  hasErrors,
  infoDiagnostic,
  warningDiagnostic,
} from '../src/diagnostics';

describe('Diagnostics', () => {
  it('should create a diagnostic with all fields', () => {
    const diag = createDiagnostic(
      'error',
      'UNRESOLVED_TYPE',
      'Type "foo" not found',
      {
        schemaName: 'geometry',
        entityName: 'point',
        attributeName: 'coords',
      },
    );

    expect(diag.severity).toBe('error');
    expect(diag.code).toBe('UNRESOLVED_TYPE');
    expect(diag.message).toBe('Type "foo" not found');
    expect(diag.schemaName).toBe('geometry');
    expect(diag.entityName).toBe('point');
    expect(diag.attributeName).toBe('coords');
  });

  it('should create error/warning/info helpers', () => {
    const err = errorDiagnostic('DUPLICATE_DECLARATION', 'Dup');
    const warn = warningDiagnostic('DUPLICATE_ATTRIBUTE', 'Dup attr');
    const info = infoDiagnostic('UNRESOLVED_TYPE', 'Info msg');

    expect(err.severity).toBe('error');
    expect(warn.severity).toBe('warning');
    expect(info.severity).toBe('info');
  });

  it('should filter diagnostics by severity', () => {
    const diagnostics: SchemaDiagnostic[] = [
      errorDiagnostic('UNRESOLVED_TYPE', 'err1'),
      warningDiagnostic('DUPLICATE_ATTRIBUTE', 'warn1'),
      errorDiagnostic('CIRCULAR_INHERITANCE', 'err2'),
      infoDiagnostic('UNRESOLVED_TYPE', 'info1'),
    ];

    expect(filterBySeverity(diagnostics, 'error')).toHaveLength(2);
    expect(filterBySeverity(diagnostics, 'warning')).toHaveLength(1);
    expect(filterBySeverity(diagnostics, 'info')).toHaveLength(1);
  });

  it('should detect errors with hasErrors', () => {
    expect(hasErrors([])).toBe(false);
    expect(hasErrors([warningDiagnostic('DUPLICATE_ATTRIBUTE', 'w')])).toBe(
      false,
    );
    expect(hasErrors([errorDiagnostic('UNRESOLVED_TYPE', 'e')])).toBe(true);
  });

  it('should format a diagnostic into readable string', () => {
    const diag = errorDiagnostic('UNRESOLVED_TYPE', 'Type "foo" not found', {
      schemaName: 'geometry',
      entityName: 'point',
      span: {
        start: { offset: 0, line: 10, column: 5 },
        end: { offset: 10, line: 10, column: 15 },
      },
    });

    const formatted = formatDiagnostic(diag);
    expect(formatted).toContain('[ERROR]');
    expect(formatted).toContain('UNRESOLVED_TYPE');
    expect(formatted).toContain('Type "foo" not found');
    expect(formatted).toContain('geometry');
    expect(formatted).toContain('point');
    expect(formatted).toContain('line 10');
  });
});
