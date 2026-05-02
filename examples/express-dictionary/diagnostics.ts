import {
  buildSchema,
  filterBySeverity,
  formatDiagnostic,
  hasErrors,
} from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const useFile = args.includes('--file');
const fileArg = args.find((a) => !a.startsWith('--'));
const filePath = fileArg ? resolve(fileArg) : null;

// ── Source: inline (with error) or file ─────────────────────

const INLINE_EXPRESS = `
SCHEMA test_diagnostics;
ENTITY bad_entity;
  attr : unknown_type;
END_ENTITY;
END_SCHEMA;
`;

let source: string;
if (useFile && filePath) {
  try {
    source = readFileSync(filePath, 'utf-8');
  } catch {
    console.error(`Could not read file: ${filePath}`);
    process.exit(1);
  }
} else {
  source = INLINE_EXPRESS;
}

// ── Parse and build ─────────────────────────────────────────

const parseResult = parseExpress(source);
if (parseResult.ast.type !== 'SchemaDeclaration') {
  console.error('Expected a schema (SchemaDeclaration) from parser.');
  process.exit(1);
}
const { diagnostics } = buildSchema(parseResult.ast);

// ── Output ──────────────────────────────────────────────────

const SEP = '─'.repeat(50);
console.log(SEP);
console.log('Diagnostics demo');
console.log(SEP);
console.log(`  hasErrors(diagnostics): ${hasErrors(diagnostics)}`);
const errors = filterBySeverity(diagnostics, 'error');
console.log(`  filterBySeverity(..., 'error'): ${errors.length} item(s)`);
console.log(SEP);

if (diagnostics.length > 0) {
  console.log('\nAll diagnostics (formatDiagnostic):');
  for (const d of diagnostics) {
    console.log(formatDiagnostic(d));
    console.log('');
  }
}

console.log('');
