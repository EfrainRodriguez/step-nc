import { getAllEntities } from '@step-nc/express-dictionary';
import { readP21 } from '@step-nc/p21-reader';
import type { AttributeValue } from '@step-nc/step-factory';
import { isInstanceRef } from '@step-nc/step-factory';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadSchemaFromFile } from '../step-factory/load-schema.js';

function formatAttrValue(val: AttributeValue | undefined): string {
  if (val === undefined) return '?';
  if (typeof val === 'object' && val !== null && isInstanceRef(val))
    return `#${val.id}`;
  return String(val);
}

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const byType = args.includes('--by-type');
const fileArg = args.find((a) => !a.startsWith('--'));
const filePath = resolve(fileArg ?? 'data/example.stp');

// ── Read file ────────────────────────────────────────────────

let source: string;
try {
  source = readFileSync(filePath, 'utf-8');
} catch {
  console.error(`Could not read file: ${filePath}`);
  process.exit(1);
}

const { schema } = loadSchemaFromFile('data/example-schema.exp');
const { model } = readP21(source, schema);

const SEP = '─'.repeat(50);

console.log(
  `\nVisiting instances: ${filePath}${byType ? ' (--by-type)' : ''}\n`,
);

if (byType) {
  console.log(SEP);
  console.log('Instances by type');
  console.log(SEP);
  const entities = getAllEntities(schema);
  for (const e of entities) {
    const instances = model.getInstancesOf(e.name);
    if (instances.length === 0) continue;
    console.log(`  ${e.name}: ${instances.length}`);
    for (const inst of instances) {
      const attrs: string[] = [];
      for (const [key, val] of inst.attributes) {
        attrs.push(`${key}=${formatAttrValue(val)}`);
      }
      console.log(`    #${inst.id}  ${attrs.join(', ')}`);
    }
  }
  console.log(SEP);
} else {
  console.log(SEP);
  console.log('All instances');
  console.log(SEP);
  for (const inst of model.getAllInstances()) {
    const attrs: string[] = [];
    for (const [key, val] of inst.attributes) {
      attrs.push(`${key}=${formatAttrValue(val)}`);
    }
    console.log(`  #${inst.id}  ${inst.typeName}  ${attrs.join(', ')}`);
  }
  console.log(SEP);
}

console.log(`  model.size: ${model.size}`);
console.log('');
