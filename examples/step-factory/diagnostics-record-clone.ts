import {
  cloneInstance,
  createAndPopulate,
  createList,
  filterBySeverity,
  formatFactoryDiagnostic,
  hasFactoryErrors,
  instanceToRecord,
  StepModel,
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

const { instance: pt, diagnostics: createDiags } = createAndPopulate(
  model,
  'cartesian_point',
  { coordinates: createList([5.0, 5.0, 5.0]) },
);

const SEP = '─'.repeat(50);

// ── Section: Diagnostics ────────────────────────────────────

console.log(SEP);
console.log('Diagnostics');
console.log(SEP);
console.log(
  `  hasFactoryErrors(createDiags): ${hasFactoryErrors(createDiags)}`,
);
const errs = filterBySeverity(createDiags, 'error');
console.log(`  filterBySeverity(..., 'error'): ${errs.length} item(s)`);
if (createDiags.length > 0) {
  console.log('  Example formatted:');
  console.log(formatFactoryDiagnostic(createDiags[0]!));
}
console.log(SEP);

// ── Section: instanceToRecord ────────────────────────────────

console.log('instanceToRecord');
console.log(SEP);
if (pt) {
  const record = instanceToRecord(pt);
  console.log('  id:', record.id);
  console.log('  typeName:', record.typeName);
  console.log('  attributes:', JSON.stringify(record.attributes, null, 2));
}
console.log(SEP);

// ── Section: Clone ───────────────────────────────────────────

console.log('Clone');
console.log(SEP);
if (pt) {
  const { instance: cloned, diagnostics: cloneDiags } = cloneInstance(
    model,
    pt.id,
  );
  if (cloned) {
    console.log(`  Original: #${pt.id} ${pt.typeName}`);
    console.log(`  Clone:    #${cloned.id} ${cloned.typeName}`);
    const origRecord = instanceToRecord(pt);
    const cloneRecord = instanceToRecord(cloned);
    console.log(
      '  Same typeName:',
      origRecord.typeName === cloneRecord.typeName,
    );
    console.log(
      '  Same attributes (keys):',
      JSON.stringify(Object.keys(cloneRecord.attributes)),
    );
    if (cloneDiags.length > 0) {
      console.log('  Clone diagnostics:', cloneDiags.length);
    }
  }
}
console.log(SEP);

// ── Optional: validateModel diagnostics example ───────────────

const modelDiags = validateModel(model);
console.log(
  `\n${modelDiags.length === 0 ? 'OK' : 'WARN'}  validateModel: ${modelDiags.length} diagnostic(s)`,
);
if (modelDiags.length > 0 && modelDiags.length <= 3) {
  for (const d of modelDiags) {
    console.log(formatFactoryDiagnostic(d));
  }
}
console.log('');
