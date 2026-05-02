import {
  createList,
  createRef,
  getDerivedAttribute,
  setAttribute,
  StepModel,
  validateWhereRules,
} from '@step-nc/step-factory';
import { loadGeometryWithRulesSchema } from './load-schema';

const SEP = '─'.repeat(50);

console.log(SEP);
console.log('DERIVED and WHERE rules');
console.log(SEP);

const schema = loadGeometryWithRulesSchema();
const model = new StepModel(schema);

// DERIVED: vector.dim
const { instance: dir } = model.createInstance('direction');
setAttribute(dir!, 'name', 'Dir1');
setAttribute(dir!, 'direction_ratios', createList([1.0, 0.0, 0.0]));

const { instance: vector } = model.createInstance('vector');
setAttribute(vector!, 'name', 'V1');
setAttribute(vector!, 'orientation', createRef(dir!.id, 'DIRECTION'));
setAttribute(vector!, 'magnitude', 10.0);

const { value: dim, diagnostics: derDiags } = getDerivedAttribute(
  vector!,
  'dim',
  model,
);
console.log('getDerivedAttribute(vector, "dim", model):', {
  value: dim,
  diagnostics: derDiags.length,
});

// WHERE: valid instance
const { instance: plmOk } = model.createInstance('positive_length_measure');
setAttribute(plmOk!, 'name', 'Length1');
setAttribute(plmOk!, 'value', 5.0);
const whereOk = validateWhereRules(plmOk!, model);
console.log(
  'validateWhereRules(positive_length_measure value=5):',
  whereOk.length,
  'diagnostics',
);

// WHERE: violation (value <= 0)
const { instance: plmBad } = model.createInstance('positive_length_measure');
setAttribute(plmBad!, 'name', 'Bad');
setAttribute(plmBad!, 'value', -1.0);
const whereBad = validateWhereRules(plmBad!, model);
const violations = whereBad.filter(
  (d) =>
    d.code === 'WHERE_RULE_VIOLATION' || d.code === 'EXPRESSION_EVAL_ERROR',
);
console.log(
  'validateWhereRules(positive_length_measure value=-1):',
  violations.length,
  'violation(s)',
);
if (violations.length > 0) {
  console.log('  ', violations[0]!.code, violations[0]!.message);
}

console.log(SEP);
