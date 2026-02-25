import {
  setAttribute,
  StepModel,
  validateModel,
  validateUniqueRules,
} from '@step-nc/step-factory';
import { loadGeometryWithRulesSchema } from './load-schema';

const SEP = '─'.repeat(50);

console.log(SEP);
console.log('UNIQUE rules example');
console.log(SEP);

const schema = loadGeometryWithRulesSchema();
const model = new StepModel(schema);

// Valid: different names
const { instance: u1 } = model.createInstance('named_unit');
setAttribute(u1!, 'name', 'meter');
setAttribute(u1!, 'symbol', 'm');
const { instance: u2 } = model.createInstance('named_unit');
setAttribute(u2!, 'name', 'kilogram');
setAttribute(u2!, 'symbol', 'kg');

let diags = validateUniqueRules(model);
console.log(
  'validateUniqueRules (different names):',
  diags.filter((d) => d.code === 'UNIQUE_VIOLATION').length,
  'violations',
);

// Violation: same name
const { instance: u3 } = model.createInstance('named_unit');
setAttribute(u3!, 'name', 'meter');
setAttribute(u3!, 'symbol', 'mt');

diags = validateUniqueRules(model);
const violations = diags.filter((d) => d.code === 'UNIQUE_VIOLATION');
console.log(
  'validateUniqueRules (duplicate name):',
  violations.length,
  'violation(s)',
);
if (violations.length > 0) {
  console.log('  ', violations[0]!.code, violations[0]!.message);
}

const modelDiags = validateModel(model);
const errors = modelDiags.filter((d) => d.severity === 'error');
console.log('validateModel total errors:', errors.length);

console.log(SEP);
