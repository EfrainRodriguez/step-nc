import {
  createAndPopulate,
  createList,
  createRef,
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

// ── Create instances ───────────────────────────────────────

const SEP = '─'.repeat(50);
const allDiags: Array<{ code: string; message: string; severity: string }> = [];

const { instance: pt, diagnostics: ptDiags } = createAndPopulate(
  model,
  'cartesian_point',
  { coordinates: createList([0.0, 0.0, 0.0]) },
);
allDiags.push(...ptDiags);
console.log(SEP);
console.log('Create instances');
console.log(SEP);
if (pt) {
  console.log(`  #${pt.id}  ${pt.typeName} (cartesian_point)`);
}

const { instance: dir, diagnostics: dirDiags } = createAndPopulate(
  model,
  'direction',
  { direction_ratios: createList([1.0, 0.0, 0.0]) },
);
allDiags.push(...dirDiags);
if (dir) {
  console.log(`  #${dir.id}  ${dir.typeName} (direction)`);
}

const { instance: vec, diagnostics: vecDiags } = createAndPopulate(
  model,
  'vector',
  {
    orientation: createRef(dir!.id, 'DIRECTION'),
    magnitude: 1.0,
  },
);
allDiags.push(...vecDiags);
if (vec) {
  console.log(`  #${vec.id}  ${vec.typeName} (vector)`);
}

console.log(SEP);
console.log(`  model.size: ${model.size}`);
console.log(SEP);

// ── Diagnostics ──────────────────────────────────────────────

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
