import type { StepModel } from '@step-nc/step-factory';
import type { WriterDiagnostic } from './diagnostics';
import { StringBufferOutput } from './p21-output';
import { serializeHeader } from './serialize-header';
import { serializeInstance } from './serialize-instance';
import type { P21WriteOptions, P21WriteResult } from './types';

function wrapLine(line: string, maxLen: number): string {
  if (line.length <= maxLen) return line;

  const parts: string[] = [];
  let current = '';

  for (let i = 0; i < line.length; i++) {
    current += line[i];
    if (current.length >= maxLen) {
      const lastComma = current.lastIndexOf(',');
      const lastParen = current.lastIndexOf('(');
      const breakPos = Math.max(lastComma, lastParen);

      if (breakPos > 0) {
        parts.push(current.substring(0, breakPos + 1));
        current = current.substring(breakPos + 1);
      } else {
        parts.push(current);
        current = '';
      }
    }
  }

  if (current.length > 0) {
    parts.push(current);
  }

  return parts.join('\n');
}

export function writeP21(
  model: StepModel,
  options?: P21WriteOptions,
): P21WriteResult {
  const diagnostics: WriterDiagnostic[] = [];
  const output = new StringBufferOutput();

  const prettyPrint = options?.formatting?.prettyPrint === true;
  const maxLineLength = options?.formatting?.maxLineLength;

  // ISO envelope open
  output.writeLine('ISO-10303-21;');

  // HEADER section
  const headerText = serializeHeader(options?.header, model.schema.name);
  output.writeLine(headerText);

  // DATA section
  output.writeLine('DATA;');

  const instances = model
    .getAllInstances()
    .sort((a, b) => (a.id as number) - (b.id as number));

  for (const instance of instances) {
    const result = serializeInstance(instance, model.schema);
    diagnostics.push(...result.diagnostics);

    let line = result.text;

    if (maxLineLength !== undefined) {
      line = wrapLine(line, maxLineLength);
    }

    if (prettyPrint) {
      output.writeLine(line);
    } else {
      output.writeLine(line);
    }
  }

  output.writeLine('ENDSEC;');

  // ISO envelope close
  output.writeLine('END-ISO-10303-21;');

  return {
    content: output.toString(),
    diagnostics,
  };
}

export function writeP21ToString(
  model: StepModel,
  options?: P21WriteOptions,
): string {
  return writeP21(model, options).content;
}
