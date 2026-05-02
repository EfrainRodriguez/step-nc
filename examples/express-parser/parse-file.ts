import {
  parseExpress,
  type SchemaDeclarationNode,
} from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const showJson = args.includes('--json');
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

console.log(`\nParsing: ${filePath}\n`);

// ── Parse ───────────────────────────────────────────────────

const result = parseExpress(source);

// ── Summary helpers ────────────────────────────────────────

function countDeclarationsByType(
  ast: SchemaDeclarationNode,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const decl of ast.declarations) {
    const kind = decl.type;
    counts[kind] = (counts[kind] ?? 0) + 1;
  }
  return counts;
}

// ── Output ──────────────────────────────────────────────────

if (showJson) {
  console.log(JSON.stringify(result.ast, null, 2));
} else {
  const SEP = '─'.repeat(50);
  console.log(SEP);
  console.log(`Schema: ${result.ast.name}`);
  console.log(SEP);

  const counts = countDeclarationsByType(result.ast);
  const declTypes = [
    'EntityDeclaration',
    'TypeDeclaration',
    'FunctionDeclaration',
    'ProcedureDeclaration',
    'RuleDeclaration',
    'ConstantDeclaration',
    'SubtypeConstraintDeclaration',
  ];
  for (const kind of declTypes) {
    const n = counts[kind] ?? 0;
    if (n > 0) {
      console.log(`  ${kind.padEnd(28)} ${n}`);
    }
  }
  const other = Object.entries(counts).filter(([k]) => !declTypes.includes(k));
  for (const [kind, n] of other) {
    console.log(`  ${kind.padEnd(28)} ${n}`);
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
