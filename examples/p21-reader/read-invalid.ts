import type { P21ParseDiagnostic } from '@step-nc/p21-parser';
import type { ReaderDiagnostic } from '@step-nc/p21-reader';
import { formatReaderDiagnostic, readP21 } from '@step-nc/p21-reader';
import { loadSchemaFromFile } from '../step-factory/load-schema.js';

// ── Invalid P21 inline (parse + reader errors) ───────────────

const invalidSource = `
ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('missing closing paren'),'2;1');
FILE_NAME('x','2024-01-01',(''),(''),'','','');
FILE_SCHEMA(('AUTO'));
ENDSEC
DATA;
#1=CPT(0.0,0.0
#2=UNKNOWN_ENTITY(1.0);
ENDSEC;
END-ISO-10303-21;
`;

const SEP = '─'.repeat(60);

console.log('\nReading invalid P21 (intentional errors)\n');

const { schema } = loadSchemaFromFile('data/example-schema.exp');
const result = readP21(invalidSource, schema, { continueOnParseError: true });

// ── Model summary ───────────────────────────────────────────

console.log(SEP);
console.log('Model (partial or empty)');
console.log(SEP);
console.log(`  model.size: ${result.model.size}`);
console.log(SEP);

// ── Diagnostics ──────────────────────────────────────────────

console.log('\nDiagnostics');
console.log(SEP);

if (result.diagnostics.length === 0) {
  console.log('  (none)');
} else {
  for (const d of result.diagnostics) {
    if ('span' in d) {
      const pos = (d as P21ParseDiagnostic).span.start;
      console.log(
        `  [${(d as P21ParseDiagnostic).severity.toUpperCase()}] ${(d as P21ParseDiagnostic).code} (${pos.line}:${pos.column}): ${(d as P21ParseDiagnostic).message}`,
      );
    } else {
      console.log(
        '  ' +
          formatReaderDiagnostic(d as ReaderDiagnostic).replace(/\n/g, '\n  '),
      );
    }
  }
}

console.log(SEP);
console.log('');
