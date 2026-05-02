import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { writeP21ToString } from '@step-nc/p21-writer';
import { StepModel, setAttribute } from '@step-nc/step-factory';

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
const { schema } = buildSchema(ast);

const model = new StepModel(schema);
const { instance } = model.createInstance('point');

setAttribute(instance!, 'x', 1.0, schema);
setAttribute(instance!, 'y', 2.0, schema);
setAttribute(instance!, 'z', 3.0, schema);

// ── Write P21 ────────────────────────────────────────────────

const p21 = writeP21ToString(model);

// ── Output ───────────────────────────────────────────────────

console.log('\nBasic P21 write from inline EXPRESS (point)\n');

const SEP = '─'.repeat(50);
console.log(SEP);
console.log('P21 output');
console.log(SEP);
console.log(p21);
console.log(SEP);
console.log('');
