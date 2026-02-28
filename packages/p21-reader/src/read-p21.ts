import type { ExpressSchema } from '@step-nc/express-dictionary';
import type { P21ParseDiagnostic } from '@step-nc/p21-parser';
import { parseP21 as parse } from '@step-nc/p21-parser';
import { StepModel } from '@step-nc/step-factory';
import type { ReaderDiagnostic } from './diagnostics';
import { loadEntities } from './entity-loader';
import type { P21ReadOptions, ReadResult } from './types';

export function readP21(
  source: string,
  schema: ExpressSchema,
  options?: P21ReadOptions,
): ReadResult {
  const continueOnError = options?.continueOnParseError === true;
  const strictRefs = options?.strictRefs !== false;

  const parseResult = parse(source);
  const parseDiagnostics: P21ParseDiagnostic[] = parseResult.diagnostics;

  const hasParseErrors = parseDiagnostics.some((d) => d.severity === 'error');

  if (hasParseErrors && !continueOnError) {
    return {
      model: new StepModel(schema),
      diagnostics: parseDiagnostics,
    };
  }

  const model = new StepModel(schema);
  const { diagnostics: readerDiagnostics } = loadEntities(
    parseResult.ast.data,
    schema,
    model,
    strictRefs,
  );

  const diagnostics: Array<P21ParseDiagnostic | ReaderDiagnostic> = [
    ...parseDiagnostics,
    ...readerDiagnostics,
  ];

  return { model, diagnostics };
}
