import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { lexExpress } from '@step-nc/express-parser';
import type { Token } from '@step-nc/express-parser';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const showAll = args.includes('--all');
const fileArg = args.find((a) => !a.startsWith('--'));
const filePath = resolve(fileArg ?? 'data/geometry.exp');

// ── Read source file ────────────────────────────────────────

let source: string;
try {
  source = readFileSync(filePath, 'utf-8');
} catch {
  console.error(`❌ Could not read file: ${filePath}`);
  process.exit(1);
}

console.log(`\n📄 Tokenizing: ${filePath}\n`);

// ── Tokenize ────────────────────────────────────────────────

const { tokens, diagnostics } = lexExpress(source);

// ── Helpers ─────────────────────────────────────────────────

function getCategory(kind: string): string {
  if (kind.startsWith('KW_')) return 'keyword';
  if (kind.startsWith('OP_')) return 'operator_keyword';
  if (kind.startsWith('BC_')) return 'builtin_constant';
  if (kind.startsWith('BF_')) return 'builtin_function';
  if (kind.startsWith('BP_')) return 'builtin_procedure';
  if (kind.startsWith('SYM_')) return 'symbol';
  if (kind.startsWith('LIT_')) return 'literal';
  if (kind === 'IDENT') return 'identifier';
  if (kind === 'EOF') return 'eof';
  return 'unknown';
}

const TRIVIA_CATEGORIES = new Set(['trivia']);

function isTrivia(token: Token): boolean {
  return TRIVIA_CATEGORIES.has(getCategory(token.kind));
}

// ── Filter tokens ───────────────────────────────────────────

const displayTokens = tokens.filter((t) => {
  if (t.kind === 'EOF') return false;
  if (!showAll && isTrivia(t)) return false;
  return true;
});

const triviaCount = tokens.filter((t) => isTrivia(t)).length;

// ── Print table ─────────────────────────────────────────────

const MAX_TEXT_WIDTH = 30;
const SEP = '─'.repeat(60);

console.log(SEP);
console.log(
  `${'Line'.padStart(6)} │ ${'Col'.padStart(4)} │ ${'Kind'.padEnd(24)} │ Text`,
);
console.log(SEP);

for (const t of displayTokens) {
  const truncated =
    t.text.length > MAX_TEXT_WIDTH
      ? t.text.slice(0, MAX_TEXT_WIDTH - 3) + '...'
      : t.text;
  const escaped = truncated.replace(/\n/g, '\\n').replace(/\r/g, '\\r');

  console.log(
    `${String(t.line).padStart(6)} │ ${String(t.column).padStart(4)} │ ${t.kind.padEnd(24)} │ ${escaped}`,
  );
}

console.log(SEP);

// ── Summary ─────────────────────────────────────────────────

if (showAll) {
  console.log(`\n✅ ${displayTokens.length} tokens (showing all)\n`);
} else if (triviaCount > 0) {
  console.log(
    `\n✅ ${displayTokens.length} tokens (${triviaCount} trivia hidden, use --all to show)\n`,
  );
} else {
  console.log(`\n✅ ${displayTokens.length} tokens\n`);
}

const counts: Record<string, number> = {};
for (const t of displayTokens) {
  const cat = getCategory(t.kind);
  counts[cat] = (counts[cat] ?? 0) + 1;
}

console.log('Summary:');
for (const [cat, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat.padEnd(20)} ${count}`);
}

// ── Diagnostics ─────────────────────────────────────────────

console.log(
  `\n${diagnostics.length === 0 ? '✅' : '⚠️'}  ${diagnostics.length} diagnostic(s)`,
);

if (diagnostics.length > 0) {
  console.log('');
  for (const d of diagnostics) {
    console.log(
      `  [${d.severity.toUpperCase()}] ${d.code} (${d.line}:${d.column}): ${d.message}`,
    );
  }
}

console.log('');
