import {
  createAndPopulate,
  createList,
  createRef,
  findReferencesTo,
  resolveRef,
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

const { instance: dir } = createAndPopulate(model, 'direction', {
  direction_ratios: createList([1.0, 0.0, 0.0]),
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { instance: vec } = createAndPopulate(model, 'vector', {
  orientation: createRef(dir!.id, 'DIRECTION'),
  magnitude: 1.0,
});

// ── Resolve reference and find references to ────────────────

const SEP = '─'.repeat(50);
console.log(SEP);
console.log('References');
console.log(SEP);

const ref = createRef(dir!.id, 'DIRECTION');
const resolved = resolveRef(model, ref);
console.log(
  '  createRef(dir.id, "DIRECTION") -> resolveRef:',
  resolved ? `#${resolved.id} ${resolved.typeName}` : 'undefined',
);
console.log(SEP);

const refsToDir = findReferencesTo(model, dir!.id);
console.log('  findReferencesTo(model, direction id):');
for (const { instance: inst, attributeName } of refsToDir) {
  console.log(`    #${inst.id} ${inst.typeName} .${attributeName}`);
}
console.log(SEP);
console.log('');
