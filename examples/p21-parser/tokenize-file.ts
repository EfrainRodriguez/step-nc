import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { lexP21 } from '@step-nc/p21-parser';
import type { P21Token } from '@step-nc/p21-parser';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const showAll = args.includes('--all');
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

console.log(`\nTokenizing: ${filePath}\n`);

// ── Tokenize ────────────────────────────────────────────────

const { tokens, diagnostics } = lexP21(source);

// ── Filter tokens (hide EOF in table by default; --all shows all) ─────

const displayTokens = tokens.filter((t) => {
  if (t.kind === 'EOF') return showAll;
  return true;
});

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

console.log(
  `\n${displayTokens.length} tokens shown (total from lexer: ${tokens.length})\n`,
);

// ── Diagnostics ─────────────────────────────────────────────

console.log(
  `${diagnostics.length === 0 ? 'OK' : 'WARN'}  ${diagnostics.length} diagnostic(s)`,
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
