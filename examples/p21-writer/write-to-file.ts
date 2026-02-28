import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import {
  formatWriterDiagnostic,
  hasWriterErrors,
  writeP21,
} from '@step-nc/p21-writer';
import { StepModel, setAttribute } from '@step-nc/step-factory';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// ── CLI args ─────────────────────────────────────────────────

const args = process.argv.slice(2);
const fileArg = args.find((a) => !a.startsWith('--'));
const outPath = resolve(fileArg ?? '../tmp/output-write-to-file.stp');

// ── EXPRESS inline ───────────────────────────────────────────

const source = `
  SCHEMA example;
    TYPE length_measure = REAL;
    END_TYPE;
    ENTITY point;
      x, y, z : length_measure;
    END_ENTITY;
  END_SCHEMA;
`;

// ── Build schema & model ─────────────────────────────────────

const ast = parseExpress(source).ast;
if (ast.type !== 'SchemaDeclaration') throw new Error('Expected schema');
const { schema } = buildSchema(ast);

const model = new StepModel(schema);
const { instance } = model.createInstance('point');
setAttribute(instance!, 'x', 1.0, schema);
setAttribute(instance!, 'y', 2.0, schema);
setAttribute(instance!, 'z', 3.0, schema);

// ── Write P21 ────────────────────────────────────────────────

const { content, diagnostics } = writeP21(model, {
  header: {
    fileName: 'output.stp',
    timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, ''),
  },
});

// ── Write file ────────────────────────────────────────────────

console.log('\nWrite P21 model to file\n');

if (!hasWriterErrors(diagnostics)) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, content, 'utf-8');
  console.log('Written:', outPath);
} else {
  console.error('Writer reported errors; not writing file.');
}

// ── Diagnostics ───────────────────────────────────────────────

console.log(
  `\n${diagnostics.length === 0 ? 'OK' : 'WARN'}  ${diagnostics.length} diagnostic(s)`,
);

if (diagnostics.length > 0) {
  console.log('');
  for (const d of diagnostics) {
    console.log(`  ${formatWriterDiagnostic(d)}`);
  }
}

console.log('');

if (hasWriterErrors(diagnostics)) {
  process.exit(1);
}
