import {
  buildSchema,
  getAllEntities,
  getAllTypes,
} from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const fileArg = args.find((a) => !a.startsWith('--'));
const filePath = resolve(fileArg ?? 'data/geometry.exp');

// ── Read source file ────────────────────────────────────────

let source: string;
try {
  source = readFileSync(filePath, 'utf-8');
} catch {
  console.error(`Could not read file: ${filePath}`);
  process.exit(1);
}

// ── Parse ───────────────────────────────────────────────────

const parseResult = parseExpress(source);
if (parseResult.ast.type !== 'SchemaDeclaration') {
  console.error('Expected a schema (SchemaDeclaration) from parser.');
  process.exit(1);
}

// ── Build schema ────────────────────────────────────────────

const result = buildSchema(parseResult.ast);
const { schema, diagnostics } = result;

// ── Output ──────────────────────────────────────────────────

const SEP = '─'.repeat(50);
console.log(SEP);
console.log(`Schema: ${schema.name}`);
console.log(SEP);
console.log(`  Entities: ${getAllEntities(schema).length}`);
console.log(`  Types:    ${getAllTypes(schema).length}`);
console.log(SEP);

// ── Diagnostics ──────────────────────────────────────────────

console.log(
  `\n${diagnostics.length === 0 ? 'OK' : 'WARN'}  ${diagnostics.length} diagnostic(s)`,
);
if (diagnostics.length > 0) {
  console.log('');
  for (const d of diagnostics) {
    const pos = d.span?.start;
    const loc = pos ? ` (${pos.line}:${pos.column})` : '';
    console.log(
      `  [${d.severity.toUpperCase()}] ${d.code}${loc}: ${d.message}`,
    );
  }
}
console.log('');
