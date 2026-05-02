import { asInstanceId } from '@step-nc/step-factory';
import { describe, expect, it } from 'vitest';
import type { WriterDiagnostic } from '../../src/diagnostics';
import {
  createWriterDiagnostic,
  errorDiag,
  filterBySeverity,
  formatWriterDiagnostic,
  hasWriterErrors,
  infoDiag,
  warningDiag,
} from '../../src/diagnostics';

describe('WriterDiagnostics', () => {
  describe('createWriterDiagnostic', () => {
    it('should create a diagnostic with all fields', () => {
      const diag = createWriterDiagnostic(
        'error',
        'UNSUPPORTED_VALUE',
        'test message',
        {
          instanceId: asInstanceId(42),
          entityName: 'POINT',
          attributeName: 'X',
        },
      );

      expect(diag.severity).toBe('error');
      expect(diag.code).toBe('UNSUPPORTED_VALUE');
      expect(diag.message).toBe('test message');
      expect(diag.instanceId).toBe(42);
      expect(diag.entityName).toBe('POINT');
      expect(diag.attributeName).toBe('X');
    });

    it('should create a diagnostic without optional context', () => {
      const diag = createWriterDiagnostic(
        'warning',
        'ENCODING_ERROR',
        'warn msg',
      );

      expect(diag.severity).toBe('warning');
      expect(diag.code).toBe('ENCODING_ERROR');
      expect(diag.message).toBe('warn msg');
      expect(diag.instanceId).toBeUndefined();
      expect(diag.entityName).toBeUndefined();
      expect(diag.attributeName).toBeUndefined();
    });
  });

  describe('severity helpers', () => {
    it('errorDiag should create error diagnostic', () => {
      const diag = errorDiag('UNSUPPORTED_VALUE', 'err');
      expect(diag.severity).toBe('error');
    });

    it('warningDiag should create warning diagnostic', () => {
      const diag = warningDiag('SERIALIZATION_WARNING', 'warn');
      expect(diag.severity).toBe('warning');
    });

    it('infoDiag should create info diagnostic', () => {
      const diag = infoDiag('SERIALIZATION_WARNING', 'info');
      expect(diag.severity).toBe('info');
    });
  });

  describe('hasWriterErrors', () => {
    it('should return true when errors exist', () => {
      const diags: WriterDiagnostic[] = [
        warningDiag('SERIALIZATION_WARNING', 'warn'),
        errorDiag('UNSUPPORTED_VALUE', 'err'),
      ];
      expect(hasWriterErrors(diags)).toBe(true);
    });

    it('should return false when no errors', () => {
      const diags: WriterDiagnostic[] = [
        warningDiag('SERIALIZATION_WARNING', 'warn'),
        infoDiag('SERIALIZATION_WARNING', 'info'),
      ];
      expect(hasWriterErrors(diags)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(hasWriterErrors([])).toBe(false);
    });
  });

  describe('filterBySeverity', () => {
    it('should filter by severity', () => {
      const diags: WriterDiagnostic[] = [
        errorDiag('UNSUPPORTED_VALUE', 'e1'),
        warningDiag('SERIALIZATION_WARNING', 'w1'),
        errorDiag('ENCODING_ERROR', 'e2'),
        infoDiag('SERIALIZATION_WARNING', 'i1'),
      ];

      expect(filterBySeverity(diags, 'error')).toHaveLength(2);
      expect(filterBySeverity(diags, 'warning')).toHaveLength(1);
      expect(filterBySeverity(diags, 'info')).toHaveLength(1);
    });
  });

  describe('formatWriterDiagnostic', () => {
    it('should format diagnostic with all fields', () => {
      const diag = errorDiag('UNSUPPORTED_VALUE', 'Cannot serialize value', {
        instanceId: asInstanceId(10),
        entityName: 'LINE',
        attributeName: 'PNT',
      });

      const formatted = formatWriterDiagnostic(diag);
      expect(formatted).toContain(
        '[ERROR] UNSUPPORTED_VALUE: Cannot serialize value',
      );
      expect(formatted).toContain('instance: #10');
      expect(formatted).toContain('entity: LINE');
      expect(formatted).toContain('attribute: PNT');
    });

    it('should format diagnostic without optional fields', () => {
      const diag = warningDiag('SERIALIZATION_WARNING', 'Some warning');
      const formatted = formatWriterDiagnostic(diag);

      expect(formatted).toBe('[WARNING] SERIALIZATION_WARNING: Some warning');
    });
  });
});
