import { SchemaRegistry } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const fileArg1 = args[0] && !args[0].startsWith('--') ? args[0] : undefined;
const fileArg2 = args[1] && !args[1].startsWith('--') ? args[1] : undefined;
const filePath1 = resolve(fileArg1 ?? 'data/geometry.exp');
const filePath2 = fileArg2 ? resolve(fileArg2) : undefined;

// ── Helpers ─────────────────────────────────────────────────

function parseFile(path: string) {
  let source: string;
  try {
    source = readFileSync(path, 'utf-8');
  } catch {
    console.error(`Could not read file: ${path}`);
    process.exit(1);
  }
  const result = parseExpress(source);
  if (result.ast.type !== 'SchemaDeclaration') {
    console.error(`Expected SchemaDeclaration in ${path}`);
    process.exit(1);
  }
  return result.ast;
}

// ── Build and register ───────────────────────────────────────

const registry = new SchemaRegistry();
const buildResult1 = registry.buildAndRegister(parseFile(filePath1));
let allDiagnostics = [...buildResult1.diagnostics];

if (filePath2) {
  const buildResult2 = registry.buildAndRegister(parseFile(filePath2));
  allDiagnostics = [...allDiagnostics, ...buildResult2.diagnostics];
  const interfaceDiags = registry.resolveInterfaces();
  allDiagnostics = [...allDiagnostics, ...interfaceDiags];
}

// ── Output ──────────────────────────────────────────────────

const SEP = '─'.repeat(50);
console.log(SEP);
console.log('SchemaRegistry');
console.log(SEP);
console.log(`  size: ${registry.size}`);
console.log('  list():');
for (const s of registry.list()) {
  console.log(`    - ${s.name}`);
}
const firstName = registry.list()[0]?.name;
if (firstName) {
  const got = registry.get(firstName);
  console.log(`  get("${firstName}"): ${got ? got.name : 'undefined'}`);
}
console.log(SEP);

// ── Diagnostics ──────────────────────────────────────────────

console.log(
  `\n${allDiagnostics.length === 0 ? 'OK' : 'WARN'}  ${allDiagnostics.length} diagnostic(s)`,
);
if (allDiagnostics.length > 0) {
  console.log('');
  for (const d of allDiagnostics) {
    const pos = d.span?.start;
    const loc = pos ? ` (${pos.line}:${pos.column})` : '';
    console.log(
      `  [${d.severity.toUpperCase()}] ${d.code}${loc}: ${d.message}`,
    );
  }
}
console.log('');
