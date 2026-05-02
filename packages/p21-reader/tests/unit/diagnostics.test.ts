import { asInstanceId } from '@step-nc/step-factory';
import { describe, expect, it } from 'vitest';
import type { ReaderDiagnostic } from '../../src/diagnostics';
import {
  createReaderDiagnostic,
  errorDiag,
  filterBySeverity,
  formatReaderDiagnostic,
  hasReaderErrors,
  infoDiag,
  warningDiag,
} from '../../src/diagnostics';

describe('ReaderDiagnostics', () => {
  describe('createReaderDiagnostic', () => {
    it('should create a diagnostic with all fields', () => {
      const diag = createReaderDiagnostic(
        'error',
        'UNKNOWN_ENTITY',
        'test message',
        {
          instanceId: asInstanceId(42),
          entityName: 'POINT',
          attributeName: 'X',
        },
      );

      expect(diag.severity).toBe('error');
      expect(diag.code).toBe('UNKNOWN_ENTITY');
      expect(diag.message).toBe('test message');
      expect(diag.instanceId).toBe(42);
      expect(diag.entityName).toBe('POINT');
      expect(diag.attributeName).toBe('X');
    });

    it('should create a diagnostic without optional context', () => {
      const diag = createReaderDiagnostic(
        'warning',
        'DANGLING_ENTITY_REF',
        'warn msg',
      );

      expect(diag.severity).toBe('warning');
      expect(diag.code).toBe('DANGLING_ENTITY_REF');
      expect(diag.message).toBe('warn msg');
      expect(diag.instanceId).toBeUndefined();
      expect(diag.entityName).toBeUndefined();
      expect(diag.attributeName).toBeUndefined();
    });
  });

  describe('severity helpers', () => {
    it('errorDiag should create error diagnostic', () => {
      const diag = errorDiag('UNKNOWN_ENTITY', 'err');
      expect(diag.severity).toBe('error');
    });

    it('warningDiag should create warning diagnostic', () => {
      const diag = warningDiag('EXTRA_PARAMETER', 'warn');
      expect(diag.severity).toBe('warning');
    });

    it('infoDiag should create info diagnostic', () => {
      const diag = infoDiag('EXTRA_PARAMETER', 'info');
      expect(diag.severity).toBe('info');
    });
  });

  describe('hasReaderErrors', () => {
    it('should return true when errors exist', () => {
      const diags: ReaderDiagnostic[] = [
        warningDiag('EXTRA_PARAMETER', 'warn'),
        errorDiag('UNKNOWN_ENTITY', 'err'),
      ];
      expect(hasReaderErrors(diags)).toBe(true);
    });

    it('should return false when no errors', () => {
      const diags: ReaderDiagnostic[] = [
        warningDiag('EXTRA_PARAMETER', 'warn'),
        infoDiag('EXTRA_PARAMETER', 'info'),
      ];
      expect(hasReaderErrors(diags)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(hasReaderErrors([])).toBe(false);
    });
  });

  describe('filterBySeverity', () => {
    it('should filter by severity', () => {
      const diags: ReaderDiagnostic[] = [
        errorDiag('UNKNOWN_ENTITY', 'e1'),
        warningDiag('EXTRA_PARAMETER', 'w1'),
        errorDiag('DUPLICATE_INSTANCE_ID', 'e2'),
        infoDiag('EXTRA_PARAMETER', 'i1'),
      ];

      expect(filterBySeverity(diags, 'error')).toHaveLength(2);
      expect(filterBySeverity(diags, 'warning')).toHaveLength(1);
      expect(filterBySeverity(diags, 'info')).toHaveLength(1);
    });
  });

  describe('formatReaderDiagnostic', () => {
    it('should format diagnostic with all fields', () => {
      const diag = errorDiag('UNKNOWN_ENTITY', 'Entity not found', {
        instanceId: asInstanceId(10),
        entityName: 'LINE',
        attributeName: 'PNT',
      });

      const formatted = formatReaderDiagnostic(diag);
      expect(formatted).toContain('[ERROR] UNKNOWN_ENTITY: Entity not found');
      expect(formatted).toContain('instance: #10');
      expect(formatted).toContain('entity: LINE');
      expect(formatted).toContain('attribute: PNT');
    });

    it('should format diagnostic without optional fields', () => {
      const diag = warningDiag('EXTRA_PARAMETER', 'Some warning');
      const formatted = formatReaderDiagnostic(diag);

      expect(formatted).toBe('[WARNING] EXTRA_PARAMETER: Some warning');
    });
  });
});
