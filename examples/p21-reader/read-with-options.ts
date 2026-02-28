import type { P21ParseDiagnostic } from '@step-nc/p21-parser';
import type { ReaderDiagnostic } from '@step-nc/p21-reader';
import { formatReaderDiagnostic, readP21 } from '@step-nc/p21-reader';
import { loadSchemaFromFile } from '../step-factory/load-schema.js';

const SEP = '─'.repeat(50);

// ── P21 with parse error (unclosed string / bad syntax) ───────

const p21WithParseError = [
  'ISO-10303-21;',
  'HEADER;',
  "FILE_DESCRIPTION((''),'2;1');",
  "FILE_NAME('test','2024-01-01',(''),(''),'','','');",
  "FILE_SCHEMA(('AUTO'));",
  'ENDSEC;',
  'DATA;',
  '#1=CPT(0.0,0.0,0.0);',
  '#2=CPT(1.0,0.0', // missing closing paren and semicolon
  'ENDSEC;',
  'END-ISO-10303-21;',
].join('\n');

// ── P21 with dangling ref (#99 does not exist) ───────────────

const p21WithDanglingRef = [
  'ISO-10303-21;',
  'HEADER;',
  "FILE_DESCRIPTION((''),'2;1');",
  "FILE_NAME('test','2024-01-01',(''),(''),'','','');",
  "FILE_SCHEMA(('AUTO'));",
  'ENDSEC;',
  'DATA;',
  '#1=CPT(0.0,0.0,0.0);',
  '#2=VX(#99);', // #99 not defined
  'ENDSEC;',
  'END-ISO-10303-21;',
].join('\n');

// ── Load schema ──────────────────────────────────────────────

const { schema } = loadSchemaFromFile('data/example-schema.exp');

// ── continueOnParseError ─────────────────────────────────────

console.log('\n' + SEP);
console.log('continueOnParseError');
console.log(SEP);

console.log('\nWith continueOnParseError: false (default)');
const r1 = readP21(p21WithParseError, schema, { continueOnParseError: false });
console.log(`  model.size: ${r1.model.size}`);
console.log(`  diagnostics: ${r1.diagnostics.length}`);
for (const d of r1.diagnostics.slice(0, 3)) {
  if ('span' in d) {
    const pos = (d as P21ParseDiagnostic).span.start;
    console.log(
      `    [${(d as P21ParseDiagnostic).severity}] ${(d as P21ParseDiagnostic).code} (${pos.line}:${pos.column}): ${(d as P21ParseDiagnostic).message}`,
    );
  } else {
    console.log(`    ${formatReaderDiagnostic(d as ReaderDiagnostic)}`);
  }
}

console.log('\nWith continueOnParseError: true');
const r2 = readP21(p21WithParseError, schema, { continueOnParseError: true });
console.log(`  model.size: ${r2.model.size}`);
console.log(`  diagnostics: ${r2.diagnostics.length}`);

console.log(SEP);

// ── strictRefs ───────────────────────────────────────────────

console.log('\n' + SEP);
console.log('strictRefs (dangling ref #99)');
console.log(SEP);

console.log('\nWith strictRefs: true (default)');
const r3 = readP21(p21WithDanglingRef, schema, { strictRefs: true });
const readerDiags3 = r3.diagnostics.filter((d) => !('span' in d));
console.log(`  model.size: ${r3.model.size}`);
console.log(`  reader diagnostics: ${readerDiags3.length}`);
for (const d of readerDiags3) {
  console.log(`    ${formatReaderDiagnostic(d as ReaderDiagnostic)}`);
}

console.log('\nWith strictRefs: false');
const r4 = readP21(p21WithDanglingRef, schema, { strictRefs: false });
const readerDiags4 = r4.diagnostics.filter((d) => !('span' in d));
console.log(`  model.size: ${r4.model.size}`);
console.log(`  reader diagnostics: ${readerDiags4.length}`);
for (const d of readerDiags4) {
  console.log(`    ${formatReaderDiagnostic(d as ReaderDiagnostic)}`);
}

console.log(SEP);
console.log('');
