import {
  buildSchema,
  getAllTypes,
  getNamedType,
  getSelectOptions,
  getType,
  isEntityType,
  isSimpleType,
  resolveToBaseType,
} from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const typeIndex = args.indexOf('--type');
const typeName =
  typeIndex >= 0 && args[typeIndex + 1] ? args[typeIndex + 1] : undefined;
const fileArg = args.find((a) => !a.startsWith('--') && a !== typeName);
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

// ── Output: list types ──────────────────────────────────────

const SEP = '─'.repeat(50);
console.log(SEP);
console.log('Types');
console.log(SEP);
const types = getAllTypes(schema);
for (const t of types) {
  console.log(`  ${t.name}`);
}
console.log(SEP);

if (!typeName) {
  console.log(
    '\nUse --type <name> to show details (e.g. --type length_measure).\n',
  );
  process.exit(0);
}

// ── Output: single type details ──────────────────────────────

const named = getNamedType(schema, typeName);
if (!named) {
  console.error(`Type or entity not found: ${typeName}`);
  process.exit(1);
}

const typeDef = getType(schema, typeName);
const isEntity = typeDef
  ? false
  : 'name' in named && 'explicitAttributes' in named;

console.log(`\nNamed: ${typeName}`);
console.log(SEP);
if (typeDef) {
  const base = resolveToBaseType(typeDef.underlyingType);
  console.log(`  getType: found`);
  console.log(`  resolveToBaseType kind: ${base.kind}`);
  console.log(
    `  isEntityType(underlying): ${isEntityType(typeDef.underlyingType)}`,
  );
  console.log(
    `  isSimpleType(underlying): ${isSimpleType(typeDef.underlyingType)}`,
  );
  if (typeDef.underlyingType.kind === 'select') {
    const options = getSelectOptions(typeDef.underlyingType);
    if (options.length > 0) {
      console.log('  getSelectOptions:');
      for (const o of options) {
        console.log(`    - ${o.name}`);
      }
    }
  }
} else if (isEntity) {
  console.log('  (entity type, use query-entities for details)');
}
console.log(SEP);
console.log('');
