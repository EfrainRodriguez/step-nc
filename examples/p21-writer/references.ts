import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { writeP21ToString } from '@step-nc/p21-writer';
import {
  createList,
  createRef,
  setAttribute,
  StepModel,
} from '@step-nc/step-factory';

// ── EXPRESS inline ───────────────────────────────────────────

const source = `
  SCHEMA test_geom;
    TYPE length_measure = REAL;
    END_TYPE;
    TYPE label = STRING;
    END_TYPE;
    ENTITY representation_item;
      name : label;
    END_ENTITY;
    ENTITY point SUBTYPE OF (representation_item);
      x, y, z : length_measure;
    END_ENTITY;
    ENTITY direction SUBTYPE OF (representation_item);
      direction_ratios : LIST [2:3] OF REAL;
    END_ENTITY;
    ENTITY line SUBTYPE OF (representation_item);
      pnt : point;
      dir : direction;
    END_ENTITY;
  END_SCHEMA;
`;

// ── Build schema & model ─────────────────────────────────────

const ast = parseExpress(source).ast;
if (ast.type !== 'SchemaDeclaration') throw new Error('Expected schema');
const { schema } = buildSchema(ast);
const model = new StepModel(schema);

// ── Create instances and references ───────────────────────────

const { instance: pt } = model.createInstance('point');
setAttribute(pt!, 'name', 'Origin', schema);
setAttribute(pt!, 'x', 0.0, schema);
setAttribute(pt!, 'y', 0.0, schema);
setAttribute(pt!, 'z', 0.0, schema);

const { instance: dir } = model.createInstance('direction');
setAttribute(dir!, 'name', 'X-axis', schema);
setAttribute(dir!, 'direction_ratios', createList([1.0, 0.0, 0.0]), schema);

const { instance: line } = model.createInstance('line');
setAttribute(line!, 'name', 'MyLine', schema);
setAttribute(line!, 'pnt', createRef(pt!.id, 'POINT'), schema);
setAttribute(line!, 'dir', createRef(dir!.id, 'DIRECTION'), schema);

// ── Write P21 ────────────────────────────────────────────────

const p21 = writeP21ToString(model, {
  header: { fileName: 'refs.stp', timestamp: '2025-01-01T00:00:00' },
});

// ── Output ───────────────────────────────────────────────────

console.log('\nP21 with entity references (point, direction, line)\n');

const SEP = '─'.repeat(50);
console.log(SEP);
console.log('P21 output (references)');
console.log(SEP);
console.log(p21);
console.log(SEP);
console.log('');
