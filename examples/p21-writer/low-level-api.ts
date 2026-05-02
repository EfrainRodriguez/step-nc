/**
 * Low-level P21 serialization API.
 * Use these when you need custom pipelines or partial output (e.g. header only, single instance).
 */
import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import {
  formatWriterDiagnostic,
  serializeAttributeValue,
  serializeHeader,
  serializeInstance,
} from '@step-nc/p21-writer';
import {
  createList,
  createRef,
  setAttribute,
  StepModel,
} from '@step-nc/step-factory';

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

// ── serializeHeader ──────────────────────────────────────────

const headerStr = serializeHeader(
  {
    description: ['Low-level demo'],
    fileName: 'low-level.stp',
    timestamp: '2025-01-01T00:00:00',
    author: ['Examples'],
    schemas: ['example'],
  },
  schema.name,
);

// ── serializeInstance ───────────────────────────────────────

const instResult = serializeInstance(instance!, schema);

// ── serializeAttributeValue ──────────────────────────────────

const realResult = serializeAttributeValue(1.5, undefined, schema);
const listResult = serializeAttributeValue(
  createList([1.0, 2.0, 3.0]),
  undefined,
  schema,
);
const refResult = serializeAttributeValue(
  createRef(instance!.id, 'POINT'),
  undefined,
  schema,
);

// ── Output ───────────────────────────────────────────────────

console.log('\nLow-level P21 API: header, instance, attribute value\n');

const SEP = '─'.repeat(50);

console.log(SEP);
console.log('Header');
console.log(SEP);
console.log(headerStr);

console.log(SEP);
console.log('Instance');
console.log(SEP);
console.log(instResult.text);

console.log(SEP);
console.log('Attribute values');
console.log(SEP);
console.log('REAL 1.5:', realResult.text);
console.log('LIST (1,2,3):', listResult.text);
console.log('Ref to point:', refResult.text);

// ── Diagnostics ───────────────────────────────────────────────

const diagnostics = instResult.diagnostics;
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
