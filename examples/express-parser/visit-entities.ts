import {
  parseExpress,
  visit,
  type EntityDeclarationNode,
  type FunctionDeclarationNode,
  type ProcedureDeclarationNode,
  type TypeDeclarationNode,
} from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const skipChildren = args.includes('--skip-children');
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

console.log(
  `\nVisiting: ${filePath}${skipChildren ? ' (--skip-children)' : ''}\n`,
);

// ── Parse ───────────────────────────────────────────────────

const { ast } = parseExpress(source);

// ── Collect via visitor ─────────────────────────────────────

const entities: { name: string; supertype?: string }[] = [];
const types: string[] = [];
const functions: string[] = [];
const procedures: string[] = [];

visit(ast, {
  onEntityDeclaration(n: EntityDeclarationNode) {
    const supertype = n.subtypeOf?.entities?.[0];
    entities.push({ name: n.name, supertype });
    if (skipChildren) return 'skip';
  },
  onTypeDeclaration(n: TypeDeclarationNode) {
    types.push(n.name);
    if (skipChildren) return 'skip';
  },
  onFunctionDeclaration(n: FunctionDeclarationNode) {
    functions.push(n.name);
    if (skipChildren) return 'skip';
  },
  onProcedureDeclaration(n: ProcedureDeclarationNode) {
    procedures.push(n.name);
    if (skipChildren) return 'skip';
  },
});

// ── Print tables ─────────────────────────────────────────────

const SEP = '─'.repeat(50);

console.log(SEP);
console.log('Entities');
console.log(SEP);
for (const e of entities) {
  const suffix = e.supertype ? ` (SUBTYPE OF ${e.supertype})` : '';
  console.log(`  ${e.name}${suffix}`);
}

console.log(SEP);
console.log('Types');
console.log(SEP);
for (const t of types) {
  console.log(`  ${t}`);
}

console.log(SEP);
console.log('Functions');
console.log(SEP);
for (const f of functions) {
  console.log(`  ${f}`);
}

console.log(SEP);
console.log('Procedures');
console.log(SEP);
for (const p of procedures) {
  console.log(`  ${p}`);
}

console.log(SEP);
console.log('');
