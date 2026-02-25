import {
  createList,
  getAttribute,
  setAttribute,
  setAttributes,
  StepModel,
} from '@step-nc/step-factory';
import { loadSchemaFromFile } from './load-schema.js';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const fileArg = args.find((a) => !a.startsWith('--'));
const filePath = fileArg ?? undefined;

// ── Load schema and create model ─────────────────────────────

const { schema } = loadSchemaFromFile(filePath);
const model = new StepModel(schema);

// ── Create instance and set attributes ───────────────────────

const SEP = '─'.repeat(50);
const { instance } = model.createInstance('cartesian_point');
if (!instance) {
  console.error('Failed to create cartesian_point');
  process.exit(1);
}

setAttribute(instance, 'coordinates', createList([1.0, 2.0, 3.0]));

const { instance: dir } = model.createInstance('direction');
const dirDiags = setAttributes(
  dir!,
  { direction_ratios: createList([0.0, 1.0, 0.0]) },
  model.schema,
);

// ── Output: read back with getAttribute ──────────────────────

console.log(SEP);
console.log('Attributes & aggregations');
console.log(SEP);
const coords = getAttribute(instance, 'coordinates');
console.log('  cartesian_point coordinates:', coords);
const ratios = dir ? getAttribute(dir, 'direction_ratios') : undefined;
console.log('  direction direction_ratios:', ratios);
console.log(SEP);

// ── Diagnostics ──────────────────────────────────────────────

const allDiags = dirDiags;
console.log(
  `\n${allDiags.length === 0 ? 'OK' : 'WARN'}  ${allDiags.length} diagnostic(s)`,
);
if (allDiags.length > 0) {
  console.log('');
  for (const d of allDiags) {
    console.log(`  [${d.severity.toUpperCase()}] ${d.code}: ${d.message}`);
  }
}
console.log('');
