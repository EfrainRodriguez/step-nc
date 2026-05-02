import {
  parseP21,
  visit,
  type HeaderEntityNode,
  type SimpleEntityInstanceNode,
  type ComplexEntityInstanceNode,
} from '@step-nc/p21-parser';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const skipChildren = args.includes('--skip-children');
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

console.log(
  `\nVisiting: ${filePath}${skipChildren ? ' (--skip-children)' : ''}\n`,
);

// ── Parse ───────────────────────────────────────────────────

const { ast } = parseP21(source);

// ── Collect via visitor ─────────────────────────────────────

const headerEntities: { keyword: string; paramCount: number }[] = [];
const dataEntities: {
  id: number;
  kind: 'simple' | 'complex';
  keyword: string;
}[] = [];

visit(ast, {
  onHeaderEntity(n: HeaderEntityNode) {
    headerEntities.push({
      keyword: n.keyword,
      paramCount: n.parameters.length,
    });
    if (skipChildren) return 'skip';
  },
  onSimpleEntityInstance(n: SimpleEntityInstanceNode) {
    dataEntities.push({
      id: n.id,
      kind: 'simple',
      keyword: n.record.keyword,
    });
    if (skipChildren) return 'skip';
  },
  onComplexEntityInstance(n: ComplexEntityInstanceNode) {
    const firstKeyword =
      n.records.length > 0 ? n.records[0]!.keyword : '(none)';
    dataEntities.push({
      id: n.id,
      kind: 'complex',
      keyword: firstKeyword,
    });
    if (skipChildren) return 'skip';
  },
});

// ── Print tables ─────────────────────────────────────────────

const SEP = '─'.repeat(50);

console.log(SEP);
console.log('Header entities');
console.log(SEP);
for (const e of headerEntities) {
  console.log(`  ${e.keyword} (${e.paramCount} params)`);
}

console.log(SEP);
console.log('Data entities');
console.log(SEP);
for (const e of dataEntities) {
  console.log(`  #${e.id} [${e.kind}] ${e.keyword}`);
}

console.log(SEP);
console.log('');
