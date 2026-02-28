import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { writeP21ToString } from '@step-nc/p21-writer';
import { createList, setAttribute, StepModel } from '@step-nc/step-factory';

// ── EXPRESS (enum) ───────────────────────────────────────────

const enumSource = `
  SCHEMA test_enum;
    TYPE direction_type = ENUMERATION OF (forward, backward, left, right);
    END_TYPE;
    ENTITY movement;
      direction : direction_type;
      distance  : REAL;
    END_ENTITY;
  END_SCHEMA;
`;

// ── EXPRESS (aggregation) ─────────────────────────────────────

const aggSource = `
  SCHEMA test_agg;
    ENTITY polygon;
      points : LIST [3:?] OF REAL;
    END_ENTITY;
  END_SCHEMA;
`;

// ── Build schemas & models ────────────────────────────────────

const astEnum = parseExpress(enumSource).ast;
if (astEnum.type !== 'SchemaDeclaration') throw new Error('Expected schema');
const { schema: schemaEnum } = buildSchema(astEnum);
const modelEnum = new StepModel(schemaEnum);
const { instance: mov } = modelEnum.createInstance('movement');
setAttribute(mov!, 'direction', 'forward', schemaEnum);
setAttribute(mov!, 'distance', 5.0, schemaEnum);

const astAgg = parseExpress(aggSource).ast;
if (astAgg.type !== 'SchemaDeclaration') throw new Error('Expected schema');
const { schema: schemaAgg } = buildSchema(astAgg);
const modelAgg = new StepModel(schemaAgg);
const { instance: poly } = modelAgg.createInstance('polygon');
setAttribute(
  poly!,
  'points',
  createList([1.0, 2.0, 3.0, 4.0, 5.0, 6.0]),
  schemaAgg,
);

// ── Write P21 ────────────────────────────────────────────────

const opts = { header: { timestamp: '2025-01-01T00:00:00' } };
const enumP21 = writeP21ToString(modelEnum, opts);
const aggP21 = writeP21ToString(modelAgg, opts);

// ── Output ───────────────────────────────────────────────────

console.log('\nP21 enumerations and LIST aggregation\n');

const SEP = '─'.repeat(50);
console.log(SEP);
console.log('Enumeration');
console.log(SEP);
console.log(enumP21);

console.log(SEP);
console.log('Aggregation LIST OF REAL');
console.log(SEP);
console.log(aggP21);

console.log(SEP);
console.log('');
