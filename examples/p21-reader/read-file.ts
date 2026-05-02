import { getAllEntities } from '@step-nc/express-dictionary';
import type { P21ParseDiagnostic } from '@step-nc/p21-parser';
import {
  formatReaderDiagnostic,
  readP21,
  type ReaderDiagnostic,
} from '@step-nc/p21-reader';
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
const showJson = args.includes('--json');
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

console.log(`\nReading P21: ${filePath}\n`);

// ── Load schema ────────────────────────────────────────────

let schema: ReturnType<typeof loadSchemaFromFile>['schema'];
try {
  const loadResult = loadSchemaFromFile('data/example-schema.exp');
  schema = loadResult.schema;
  const errors = (loadResult.diagnostics ?? []).filter(
    (d) => d.severity === 'error',
  );
  if (errors.length > 0) {
    console.error(
      'Schema build errors:',
      errors.map((e) => e.message).join('; '),
    );
    process.exit(1);
  }
} catch (err) {
  console.error(
    'Failed to load schema:',
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
}

// ── Read P21 ────────────────────────────────────────────────

const result = readP21(source, schema);
const { model, diagnostics } = result;

// ── Output ──────────────────────────────────────────────────

const SEP = '─'.repeat(50);

if (showJson) {
  const summary = {
    size: model.size,
    instances: model.getAllInstances().map((inst) => ({
      id: inst.id,
      type: inst.typeName,
      attributes: Object.fromEntries(
        [...inst.attributes.entries()].map(([k, v]) => [k, v]),
      ),
    })),
    diagnosticsCount: diagnostics.length,
  };
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(SEP);
  console.log('Model summary');
  console.log(SEP);
  console.log(`  model.size: ${model.size}`);

  const entities = getAllEntities(schema);
  for (const e of entities) {
    const instances = model.getInstancesOf(e.name);
    if (instances.length > 0) {
      console.log(`  ${e.name}: ${instances.length}`);
    }
  }

  console.log(SEP);
  console.log('Instances');
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

// ── Diagnostics ──────────────────────────────────────────────

console.log(
  `\n${diagnostics.length === 0 ? 'OK' : 'WARN'}  ${diagnostics.length} diagnostic(s)`,
);

if (diagnostics.length > 0) {
  console.log('');
  for (const d of diagnostics) {
    if ('span' in d) {
      const pos = (d as P21ParseDiagnostic).span.start;
      console.log(
        `  [${(d as P21ParseDiagnostic).severity.toUpperCase()}] ${(d as P21ParseDiagnostic).code} (${pos.line}:${pos.column}): ${(d as P21ParseDiagnostic).message}`,
      );
    } else {
      console.log(formatReaderDiagnostic(d as ReaderDiagnostic));
    }
  }
}

console.log('');
