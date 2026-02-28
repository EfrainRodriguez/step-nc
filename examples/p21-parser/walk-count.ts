import { parseP21, walk, type P21NodeBase } from '@step-nc/p21-parser';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const postOrder = args.includes('--post');
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

console.log(`\nWalking: ${filePath} (order: ${postOrder ? 'post' : 'pre'})\n`);

// ── Parse ───────────────────────────────────────────────────

const { ast } = parseP21(source);

// ── Count nodes by type ─────────────────────────────────────

const counts: Record<string, number> = {};

walk(
  ast,
  (node: P21NodeBase) => {
    const t = node.type;
    counts[t] = (counts[t] ?? 0) + 1;
  },
  { order: postOrder ? 'post' : 'pre' },
);

// ── Print table ─────────────────────────────────────────────

const SEP = '─'.repeat(50);
console.log(SEP);
console.log('Node type              Count');
console.log(SEP);

const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
for (const [type, count] of entries) {
  console.log(`  ${type.padEnd(22)} ${count}`);
}

const total = entries.reduce((s, [, c]) => s + c, 0);
console.log(SEP);
console.log(`  ${'TOTAL'.padEnd(22)} ${total}`);
console.log('');
