import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { writeP21ToString } from '@step-nc/p21-writer';
import { createList, setAttribute, StepModel } from '@step-nc/step-factory';

// ── EXPRESS inline ───────────────────────────────────────────

const source = `
  SCHEMA example;
    TYPE length_measure = REAL;
    END_TYPE;
    ENTITY point;
      x, y, z : length_measure;
    END_ENTITY;
    ENTITY poly;
      coords : LIST [3:?] OF REAL;
    END_ENTITY;
  END_SCHEMA;
`;

// ── Build schema & model ─────────────────────────────────────

const ast = parseExpress(source).ast;
if (ast.type !== 'SchemaDeclaration') throw new Error('Expected schema');
const { schema } = buildSchema(ast);

const model = new StepModel(schema);
const { instance } = model.createInstance('poly');
setAttribute(
  instance!,
  'coords',
  createList([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0]),
  schema,
);

// ── Write variants (default, pretty, wrap) ───────────────────

const defaultP21 = writeP21ToString(model, {
  header: { fileName: 'format-default.stp', timestamp: '2025-01-01T00:00:00' },
});
const prettyP21 = writeP21ToString(model, {
  header: { fileName: 'format-pretty.stp', timestamp: '2025-01-01T00:00:00' },
  formatting: { prettyPrint: true },
});
const wrappedP21 = writeP21ToString(model, {
  header: { fileName: 'format-wrap.stp', timestamp: '2025-01-01T00:00:00' },
  formatting: { maxLineLength: 72 },
});

// ── Output ───────────────────────────────────────────────────

console.log(
  '\nP21 formatting options: default, pretty print, max line length\n',
);

const SEP = '─'.repeat(60);
console.log(SEP);
console.log('Default');
console.log(SEP);
console.log(defaultP21);

console.log(SEP);
console.log('Pretty print');
console.log(SEP);
console.log(prettyP21);

console.log(SEP);
console.log('Max line length 72');
console.log(SEP);
console.log(wrappedP21);

console.log(SEP);
console.log('');
