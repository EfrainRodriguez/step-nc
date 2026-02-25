import type { FactoryDiagnostic } from '../diagnostics';
import { infoDiag } from '../diagnostics';
import type { StepModel } from '../model/step-model';
import { validateReferences } from '../references/reference-resolver';
import { validateInstance } from './validate-instance';

export function validateModel(model: StepModel): FactoryDiagnostic[] {
  const diagnostics: FactoryDiagnostic[] = [];

  for (const instance of model.getAllInstances()) {
    diagnostics.push(...validateInstance(instance, model));
  }

  const refDiags = validateReferences(model);
  for (const rd of refDiags) {
    const isDuplicate = diagnostics.some(
      (d) =>
        d.code === rd.code &&
        d.instanceId === rd.instanceId &&
        d.attributeName === rd.attributeName,
    );
    if (!isDuplicate) {
      diagnostics.push(rd);
    }
  }

  diagnostics.push(
    infoDiag(
      'BOUNDS_VIOLATION',
      'Unique rules validation is not yet implemented (planned for v0.2)',
    ),
  );

  return diagnostics;
}
