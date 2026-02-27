import { buildSchema } from '@step-nc/express-dictionary';
import { parseExpress } from '@step-nc/express-parser';
import { writeP21ToString } from '@step-nc/p21-writer';
import { StepModel, setAttribute } from '@step-nc/step-factory';

const source = `
  SCHEMA example;
    TYPE length_measure = REAL;
    END_TYPE;
    ENTITY point;
      x, y, z : length_measure;
    END_ENTITY;
  END_SCHEMA;
`;

const ast = parseExpress(source).ast;
const { schema } = buildSchema(ast);

const model = new StepModel(schema);
const { instance } = model.createInstance('point');

setAttribute(instance!, 'x', 1.0, schema);
setAttribute(instance!, 'y', 2.0, schema);
setAttribute(instance!, 'z', 3.0, schema);

const p21 = writeP21ToString(model);
console.log(p21);
