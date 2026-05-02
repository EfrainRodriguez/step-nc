import { parseP21 } from '@step-nc/p21-parser';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const showJson = args.includes('--json');
const fileArg = args.find((a) => !a.startsWith('--'));
const filePath = resolve(fileArg ?? 'data/example.stp');

// ── Read source file ────────────────────────────────────────

let source: string;
try {
  source = readFileSync(filePath, 'utf-8');
} catch {
  console.error(`Could not read file: ${filePath}`);
  process.exit(1);
}

console.log(`\nParsing: ${filePath}\n`);

// ── Parse ───────────────────────────────────────────────────

const result = parseP21(source);

// ── Output ──────────────────────────────────────────────────

if (showJson) {
  console.log(JSON.stringify(result.ast, null, 2));
} else {
  const SEP = '─'.repeat(50);
  console.log(SEP);
  console.log('Schema');
  console.log(SEP);

  const headerEntities = result.ast.header.entities;
  console.log(`Header entities: ${headerEntities.length}`);
  for (const e of headerEntities) {
    const paramsSummary =
      e.parameters.length > 0 ? ` (${e.parameters.length} params)` : '';
    console.log(`  ${e.keyword}${paramsSummary}`);
  }

  console.log(SEP);
  console.log('Data sections');
  console.log(SEP);
  console.log(`Count: ${result.ast.data.length}`);
  for (let i = 0; i < result.ast.data.length; i++) {
    const section = result.ast.data[i]!;
    const name = section.name ?? '(unnamed)';
    console.log(`  [${i}] ${name}: ${section.entities.length} entities`);
  }

  console.log(SEP);
}

// ── Diagnostics ──────────────────────────────────────────────

console.log(
  `\n${result.diagnostics.length === 0 ? 'OK' : 'WARN'}  ${result.diagnostics.length} diagnostic(s)`,
);

if (result.diagnostics.length > 0) {
  console.log('');
  for (const d of result.diagnostics) {
    const pos = d.span.start;
    console.log(
      `  [${d.severity.toUpperCase()}] ${d.code} (${pos.line}:${pos.column}): ${d.message}`,
    );
  }
}

console.log('');
