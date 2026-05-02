import {
  createAndPopulate,
  createList,
  createRef,
  filterBySeverity,
  isInstanceComplete,
  StepModel,
  validateInstance,
  validateModel,
} from '@step-nc/step-factory';
import { loadSchemaFromFile } from './load-schema.js';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const fileArg = args.find((a) => !a.startsWith('--'));
const filePath = fileArg ?? undefined;

// ── Load schema and create model ─────────────────────────────

const { schema } = loadSchemaFromFile(filePath);
const model = new StepModel(schema);

const { instance: pt } = createAndPopulate(model, 'cartesian_point', {
  coordinates: createList([0.0, 0.0, 0.0]),
});
const { instance: dir } = createAndPopulate(model, 'direction', {
  direction_ratios: createList([1.0, 0.0, 0.0]),
});
createAndPopulate(model, 'vector', {
  orientation: createRef(dir!.id, 'DIRECTION'),
  magnitude: 1.0,
});

// ── Validate ─────────────────────────────────────────────────

const SEP = '─'.repeat(50);
console.log(SEP);
console.log('Validate model');
console.log(SEP);

if (pt) {
  const complete = isInstanceComplete(pt);
  console.log(`  Instance #${pt.id} (${pt.typeName}) complete: ${complete}`);
  const instanceDiags = validateInstance(pt, model);
  console.log(
    `  validateInstance(#${pt.id}) diagnostics: ${instanceDiags.length}`,
  );
}
console.log(SEP);

const modelDiags = validateModel(model);
const errors = filterBySeverity(modelDiags, 'error');
console.log(
  `  validateModel: ${errors.length} error(s), ${modelDiags.length} total diagnostic(s)`,
);
if (modelDiags.length > 0) {
  console.log('');
  for (const d of modelDiags) {
    console.log(`  [${d.severity.toUpperCase()}] ${d.code}: ${d.message}`);
  }
}
console.log(SEP);
console.log(
  errors.length === 0
    ? '\nOK  No validation errors.\n'
    : '\nWARN  See errors above.\n',
);
