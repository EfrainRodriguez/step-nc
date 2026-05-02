import type { WriterDiagnostic } from './diagnostics';

export interface P21HeaderOptions {
  description?: string[];
  implementationLevel?: string;
  fileName?: string;
  timestamp?: string;
  author?: string[];
  organization?: string[];
  preprocessorVersion?: string;
  originatingSystem?: string;
  authorization?: string;
  schemas?: string[];
}

export interface P21FormattingOptions {
  maxLineLength?: number;
  prettyPrint?: boolean;
  includeComments?: boolean;
}

export interface P21WriteOptions {
  header?: P21HeaderOptions;
  formatting?: P21FormattingOptions;
}

export interface P21WriteResult {
  content: string;
  diagnostics: WriterDiagnostic[];
}
