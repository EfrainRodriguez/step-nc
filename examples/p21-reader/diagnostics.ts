import type { P21ParseDiagnostic } from '@step-nc/p21-parser';
import {
  filterBySeverity,
  formatReaderDiagnostic,
  hasReaderErrors,
  readP21,
  type ReaderDiagnostic,
} from '@step-nc/p21-reader';
import { loadSchemaFromFile } from '../step-factory/load-schema.js';

const SEP = '─'.repeat(50);

// ── P21 that triggers reader diagnostics ─────────────────────
// Unknown entity FOO; dangling ref in #3=VX(#99)
const source = [
  'ISO-10303-21;',
  'HEADER;',
  "FILE_DESCRIPTION((''),'2;1');",
  "FILE_NAME('test','2024-01-01',(''),(''),'','','');",
  "FILE_SCHEMA(('AUTO'));",
  'ENDSEC;',
  'DATA;',
  '#1=CPT(0.0,0.0,0.0);',
  '#2=FOO(1.0);', // FOO not in schema → UNKNOWN_ENTITY
  '#3=VX(#99);', // #99 missing → DANGLING_ENTITY_REF
  'ENDSEC;',
  'END-ISO-10303-21;',
].join('\n');

const { schema } = loadSchemaFromFile('data/example-schema.exp');
const result = readP21(source, schema, { strictRefs: true });

const allDiags = result.diagnostics;
const readerDiags = allDiags.filter(
  (d): d is ReaderDiagnostic => !('span' in d),
);
const parseDiags = allDiags.filter((d): d is P21ParseDiagnostic => 'span' in d);

console.log('\n' + SEP);
console.log('Reader diagnostics');
console.log(SEP);
console.log(
  `  Total: ${allDiags.length} (parse: ${parseDiags.length}, reader: ${readerDiags.length})`,
);
console.log(`  hasReaderErrors: ${hasReaderErrors(readerDiags)}`);
console.log(SEP);

console.log('\nBy severity (reader only)');
console.log(SEP);
for (const severity of ['error', 'warning', 'info'] as const) {
  const filtered = filterBySeverity(readerDiags, severity);
  if (filtered.length > 0) {
    console.log(`  ${severity}: ${filtered.length}`);
    for (const d of filtered) {
      console.log('    ' + formatReaderDiagnostic(d).replace(/\n/g, '\n    '));
    }
  }
}
console.log(SEP);

console.log('\nAll reader diagnostics (formatted)');
console.log(SEP);
for (const d of readerDiags) {
  console.log(formatReaderDiagnostic(d));
  console.log('');
}
console.log(SEP);
console.log('');
