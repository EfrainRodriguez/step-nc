import type { ExpressSchema } from '@step-nc/express-dictionary';
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import {
  filterBySeverity,
  formatWriterDiagnostic,
  hasWriterErrors,
  writeP21,
} from '@step-nc/p21-writer';
import { StepModel, setAttribute } from '@step-nc/step-factory';

// ── Helpers ──────────────────────────────────────────────────

function runModel(
  _label: string,
  source: string,
  setup: (model: StepModel, schema: ExpressSchema) => void,
) {
  const ast = parseExpress(source).ast;
  if (ast.type !== 'SchemaDeclaration') throw new Error('Expected schema');
  const { schema } = buildSchema(ast);
  const model = new StepModel(schema);
  setup(model, schema);
  return {
    result: writeP21(model, {
      header: { timestamp: '2025-01-01T00:00:00' },
    }),
  };
}

// ── Correct model ─────────────────────────────────────────────

console.log(
  '\nP21 writer diagnostics: correct model vs optional/unsupported\n',
);

const SEP = '─'.repeat(50);

const correct = runModel(
  'Correct',
  `
  SCHEMA example;
    ENTITY point; x, y, z : REAL; END_ENTITY;
  END_SCHEMA;
`,
  (model, schema) => {
    const { instance } = model.createInstance('point');
    setAttribute(instance!, 'x', 1.0, schema);
    setAttribute(instance!, 'y', 2.0, schema);
    setAttribute(instance!, 'z', 3.0, schema);
  },
);

// ── Output (correct) ─────────────────────────────────────────

console.log(SEP);
console.log('Correct model');
console.log(SEP);
console.log('Has errors:', hasWriterErrors(correct.result.diagnostics));
console.log(
  'Warnings:',
  filterBySeverity(correct.result.diagnostics, 'warning').length,
);
if (correct.result.diagnostics.length === 0) {
  console.log('(No diagnostics)');
}
console.log(SEP);

// ── Model with optional/unsupported ───────────────────────────

const withOpt = runModel(
  'WithOptional',
  `
  SCHEMA example;
    ENTITY item; req : REAL; opt : OPTIONAL STRING; END_ENTITY;
  END_SCHEMA;
`,
  (model, schema) => {
    const { instance } = model.createInstance('item');
    setAttribute(instance!, 'req', 1.0, schema);
  },
);

// ── Output (with optional) ───────────────────────────────────

console.log(SEP);
console.log('Model with optional/unsupported');
console.log(SEP);
console.log('Has errors:', hasWriterErrors(withOpt.result.diagnostics));
['error', 'warning', 'info'].forEach((sev) => {
  const list = filterBySeverity(
    withOpt.result.diagnostics,
    sev as 'error' | 'warning' | 'info',
  );
  if (list.length) console.log(sev + 's:', list.length);
});
console.log(SEP);

// ── Diagnostics ───────────────────────────────────────────────

const allDiagnostics = [
  ...correct.result.diagnostics,
  ...withOpt.result.diagnostics,
];
console.log(
  `\n${allDiagnostics.length === 0 ? 'OK' : 'WARN'}  ${allDiagnostics.length} diagnostic(s)`,
);

if (allDiagnostics.length > 0) {
  console.log('');
  for (const d of allDiagnostics) {
    console.log(`  ${formatWriterDiagnostic(d)}`);
  }
}

console.log('');
