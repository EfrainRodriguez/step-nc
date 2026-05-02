import type { P21HeaderOptions } from './types';

function escapeP21String(value: string): string {
  let result = '';
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)!;
    const ch = value[i]!;

    if (ch === '\\') {
      result += '\\\\';
    } else if (ch === "'") {
      result += "''";
    } else if (code > 126 || code < 32) {
      const codePoint = value.codePointAt(i)!;
      if (codePoint > 0xffff) {
        result +=
          '\\X4\\' +
          codePoint.toString(16).toUpperCase().padStart(8, '0') +
          '\\X0\\';
        i++;
      } else {
        result +=
          '\\X2\\' +
          codePoint.toString(16).toUpperCase().padStart(4, '0') +
          '\\X0\\';
      }
    } else {
      result += ch;
    }
  }
  return "'" + result + "'";
}

function formatStringArray(values: string[]): string {
  if (values.length === 0) return "('')";
  return '(' + values.map(escapeP21String).join(',') + ')';
}

function defaultTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '');
}

export function serializeHeader(
  options: P21HeaderOptions | undefined,
  schemaName: string,
): string {
  const opts = options ?? {};

  const descriptions = opts.description ?? [''];
  const implementationLevel = opts.implementationLevel ?? '2;1';
  const fileName = opts.fileName ?? '';
  const timestamp = opts.timestamp ?? defaultTimestamp();
  const authors = opts.author ?? [''];
  const organizations = opts.organization ?? [''];
  const preprocessorVersion = opts.preprocessorVersion ?? '';
  const originatingSystem = opts.originatingSystem ?? '';
  const authorization = opts.authorization ?? '';
  const schemas = opts.schemas ?? [schemaName];

  const lines: string[] = [];

  lines.push('HEADER;');

  // FILE_DESCRIPTION
  lines.push(
    `FILE_DESCRIPTION(${formatStringArray(descriptions)},${escapeP21String(implementationLevel)});`,
  );

  // FILE_NAME
  lines.push(
    `FILE_NAME(${escapeP21String(fileName)},${escapeP21String(timestamp)},${formatStringArray(authors)},${formatStringArray(organizations)},${escapeP21String(preprocessorVersion)},${escapeP21String(originatingSystem)},${escapeP21String(authorization)});`,
  );

  // FILE_SCHEMA
  const schemaEntries = '(' + schemas.map(escapeP21String).join(',') + ')';
  lines.push(`FILE_SCHEMA(${schemaEntries});`);

  lines.push('ENDSEC;');

  return lines.join('\n');
}
