import { setAttribute, StepModel } from '@step-nc/step-factory';
import { loadMultiSchemaFromFile } from './load-schema';

const SEP = '─'.repeat(50);

console.log(SEP);
console.log('Multi-schema');
console.log(SEP);

const { registry, extendedSchema } = loadMultiSchemaFromFile();
const model = new StepModel(extendedSchema, { registry });

const { instance: base } = model.createInstance('base_point');
setAttribute(base!, 'x', 0);
setAttribute(base!, 'y', 0);
setAttribute(base!, 'z', 0);

const { instance: colored } = model.createInstance('colored_point');
setAttribute(colored!, 'x', 1);
setAttribute(colored!, 'y', 1);
setAttribute(colored!, 'z', 1);
setAttribute(colored!, 'color_name', 'red');

console.log(
  'getEntityOriginSchema(base_point):',
  model.getEntityOriginSchema(base!),
);
console.log(
  'getEntityOriginSchema(colored_point):',
  model.getEntityOriginSchema(colored!),
);

const allBasePoints = model.getInstancesOf('BASE_POINT', true);
console.log(
  'getInstancesOf(BASE_POINT, true):',
  allBasePoints.length,
  'instance(s)',
);

console.log(SEP);
