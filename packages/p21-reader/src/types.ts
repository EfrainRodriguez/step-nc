import type { P21ParseDiagnostic } from '@step-nc/p21-parser';
import type { StepModel } from '@step-nc/step-factory';
import type { ReaderDiagnostic } from './diagnostics';

export interface P21ReadOptions {
  /** If true, continue loading entities even when parsing produced errors. Default: false. */
  continueOnParseError?: boolean;
  /** If true, dangling entity refs produce errors; if false, warnings. Default: true. */
  strictRefs?: boolean;
}

export interface ReadResult {
  readonly model: StepModel;
  readonly diagnostics: ReadonlyArray<P21ParseDiagnostic | ReaderDiagnostic>;
}
