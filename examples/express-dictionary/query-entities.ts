import {
  buildSchema,
  getAllEntities,
  getDirectSubtypes,
  getEntity,
  getInheritedAttributes,
  getOwnAttributes,
  getSupertypeChain,
} from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const entityIndex = args.indexOf('--entity');
const entityName =
  entityIndex >= 0 && args[entityIndex + 1] ? args[entityIndex + 1] : undefined;
const fileArg = args.find((a) => !a.startsWith('--') && a !== entityName);
const filePath = resolve(fileArg ?? 'data/geometry.exp');

// ── Read source file ────────────────────────────────────────

let source: string;
try {
  source = readFileSync(filePath, 'utf-8');
} catch {
  console.error(`Could not read file: ${filePath}`);
  process.exit(1);
}

// ── Parse and build ─────────────────────────────────────────

const parseResult = parseExpress(source);
if (parseResult.ast.type !== 'SchemaDeclaration') {
  console.error('Expected a schema (SchemaDeclaration) from parser.');
  process.exit(1);
}
const { schema } = buildSchema(parseResult.ast);

// ── Output: list entities ───────────────────────────────────

const SEP = '─'.repeat(50);
console.log(SEP);
console.log('Entities');
console.log(SEP);
const entities = getAllEntities(schema);
for (const e of entities) {
  console.log(`  ${e.name}`);
}
console.log(SEP);

if (!entityName) {
  console.log('\nUse --entity <name> to show details (e.g. --entity point).\n');
  process.exit(0);
}

// ── Output: single entity details ───────────────────────────

const entity = getEntity(schema, entityName);
if (!entity) {
  console.error(`Entity not found: ${entityName}`);
  process.exit(1);
}

console.log(`\nEntity: ${entity.name}`);
console.log(SEP);
const chain = getSupertypeChain(entity);
if (chain.length > 0) {
  console.log('Supertype chain:');
  for (const s of chain) {
    console.log(`  -> ${s.name}`);
  }
}
const directSubs = getDirectSubtypes(entity);
if (directSubs.length > 0) {
  console.log('Direct subtypes:');
  for (const s of directSubs) {
    console.log(`  - ${s.name}`);
  }
}
const own = getOwnAttributes(entity);
if (own.length > 0) {
  console.log('Own attributes:');
  for (const a of own) {
    console.log(`  - ${a.name}`);
  }
}
const inherited = getInheritedAttributes(entity);
if (inherited.length > 0) {
  console.log('Inherited attributes:');
  for (const a of inherited) {
    console.log(`  - ${a.name}`);
  }
}
console.log(SEP);
console.log('');
