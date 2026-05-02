import { getAllEntities } from '@step-nc/express-dictionary';
import { StepModel } from '@step-nc/step-factory';
import { loadSchemaFromFile } from './load-schema.js';

// ── CLI args ────────────────────────────────────────────────

const args = process.argv.slice(2);
const fileArg = args.find((a) => !a.startsWith('--'));
const filePath = fileArg ?? undefined;

// ── Load schema and create model ─────────────────────────────

const { schema, diagnostics: buildDiags } = loadSchemaFromFile(filePath);
const model = new StepModel(schema);

// ── Output ───────────────────────────────────────────────────

const SEP = '─'.repeat(50);
console.log(SEP);
console.log('Build model');
console.log(SEP);
console.log(`  Schema: ${schema.name}`);
console.log(`  model.size: ${model.size}`);
const entities = getAllEntities(schema);
const sample = entities.slice(0, 5).map((e) => e.name);
console.log(
  `  Sample entities: ${sample.join(', ')}${entities.length > 5 ? '...' : ''}`,
);
console.log(SEP);

// ── Diagnostics ──────────────────────────────────────────────

console.log(
  `\n${buildDiags.length === 0 ? 'OK' : 'WARN'}  ${buildDiags.length} diagnostic(s)`,
);
if (buildDiags.length > 0) {
  console.log('');
  for (const d of buildDiags) {
    const pos = (d as { span?: { start?: { line: number; column: number } } })
      .span?.start;
    const loc = pos ? ` (${pos.line}:${pos.column})` : '';
    console.log(
      `  [${(d as { severity: string }).severity.toUpperCase()}] ${(d as { code: string }).code}${loc}: ${(d as { message: string }).message}`,
    );
  }
}
console.log('');
