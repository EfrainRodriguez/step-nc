import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { writeP21ToString } from '@step-nc/p21-writer';
import {
  createRef,
  createSelectValue,
  INDETERMINATE,
  setAttribute,
  StepModel,
} from '@step-nc/step-factory';

// ── EXPRESS (SELECT) ─────────────────────────────────────────

const selectSchemaSource = `
  SCHEMA test_select;
    TYPE geometric_select = SELECT (point, direction);
    END_TYPE;
    ENTITY point;
      x : REAL;
      y : REAL;
    END_ENTITY;
    ENTITY direction;
      dx : REAL;
      dy : REAL;
    END_ENTITY;
    ENTITY container;
      item : geometric_select;
    END_ENTITY;
  END_SCHEMA;
`;

// ── EXPRESS (complex entity) ──────────────────────────────────

const complexSchemaSource = `
  SCHEMA test_complex;
    TYPE si_prefix = ENUMERATION OF (milli, centi, kilo);
    END_TYPE;
    TYPE si_unit_name = ENUMERATION OF (metre, kilogram, second);
    END_TYPE;
    ENTITY named_unit;
      dimensions : OPTIONAL INTEGER;
    END_ENTITY;
    ENTITY si_unit SUBTYPE OF (named_unit);
      prefix : OPTIONAL si_prefix;
      unit_name : si_unit_name;
    END_ENTITY;
    ENTITY length_unit SUBTYPE OF (named_unit);
    END_ENTITY;
    ENTITY length_si_unit SUBTYPE OF (si_unit, length_unit);
    END_ENTITY;
  END_SCHEMA;
`;

// ── Build schemas & models ────────────────────────────────────

const opts = { header: { timestamp: '2025-01-01T00:00:00' } };

const astSelect = parseExpress(selectSchemaSource).ast;
if (astSelect.type !== 'SchemaDeclaration') throw new Error('Expected schema');
const { schema: schemaSelect } = buildSchema(astSelect);
const modelSelect = new StepModel(schemaSelect);
const { instance: pt } = modelSelect.createInstance('point');
setAttribute(pt!, 'x', 1.0, schemaSelect);
setAttribute(pt!, 'y', 2.0, schemaSelect);
const { instance: container } = modelSelect.createInstance('container');
setAttribute(
  container!,
  'item',
  createSelectValue(['GEOMETRIC_SELECT', 'POINT'], createRef(pt!.id, 'POINT')),
  schemaSelect,
);

const astComplex = parseExpress(complexSchemaSource).ast;
if (astComplex.type !== 'SchemaDeclaration') throw new Error('Expected schema');
const { schema: schemaComplex } = buildSchema(astComplex);
const modelComplex = new StepModel(schemaComplex);
const { instance: lenUnit } = modelComplex.createInstance('length_si_unit');
setAttribute(lenUnit!, 'dimensions', INDETERMINATE);
setAttribute(lenUnit!, 'prefix', 'milli', schemaComplex);
setAttribute(lenUnit!, 'unit_name', 'metre', schemaComplex);

// ── Write P21 ────────────────────────────────────────────────

const selectP21 = writeP21ToString(modelSelect, opts);
const complexP21 = writeP21ToString(modelComplex, opts);

// ── Output ───────────────────────────────────────────────────

console.log('\nP21 SELECT type and complex entity (multiple supertypes)\n');

const SEP = '─'.repeat(50);
console.log(SEP);
console.log('SELECT (POINT #1)');
console.log(SEP);
console.log(selectP21);

console.log(SEP);
console.log('Complex entity');
console.log(SEP);
console.log(complexP21);

console.log(SEP);
console.log('');
