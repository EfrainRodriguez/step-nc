import { describe, expect, it } from 'vitest';
import {
  StepModel,
  createAndPopulate,
  createList,
  createRef,
  createSelectValue,
  createSet,
  getAttribute,
  instanceToRecord,
  isInstanceComplete,
  validateModel,
} from '../../src';
import { buildTestSchema } from '../fixtures/build-test-schema';

describe('Integration: geometry instances with test-geometry.exp', () => {
  function setupGeometryModel() {
    const schema = buildTestSchema();
    const model = new StepModel(schema);

    const { instance: pt1 } = createAndPopulate(model, 'cartesian_point', {
      name: 'Origin',
      coordinates: createList([0.0, 0.0, 0.0]),
    });

    const { instance: pt2 } = createAndPopulate(model, 'cartesian_point', {
      name: 'End',
      coordinates: createList([10.0, 0.0, 0.0]),
    });

    const { instance: dir } = createAndPopulate(model, 'direction', {
      name: 'X-axis',
      direction_ratios: createList([1.0, 0.0, 0.0]),
    });

    const { instance: line } = createAndPopulate(model, 'line', {
      name: 'My Line',
      pnt: createRef(pt1!.id, 'CARTESIAN_POINT'),
      dir: createRef(dir!.id, 'DIRECTION'),
    });

    return { model, pt1: pt1!, pt2: pt2!, dir: dir!, line: line! };
  }

  it('should create full pipeline: parse → dictionary → factory', () => {
    const { model, pt1, dir, line } = setupGeometryModel();

    expect(model.size).toBe(4);
    expect(pt1.typeName).toBe('CARTESIAN_POINT');
    expect(dir.typeName).toBe('DIRECTION');
    expect(line.typeName).toBe('LINE');
    expect(isInstanceComplete(pt1)).toBe(true);
    expect(isInstanceComplete(line)).toBe(true);
  });

  it('should validate model without errors', () => {
    const { model } = setupGeometryModel();

    const diags = validateModel(model);
    const errors = diags.filter((d) => d.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('should query polymorphically via getInstancesOf', () => {
    const { model } = setupGeometryModel();

    const allGri = model.getInstancesOf('GEOMETRIC_REPRESENTATION_ITEM', true);
    expect(allGri).toHaveLength(4);

    const allPoints = model.getInstancesOf('POINT', true);
    expect(allPoints).toHaveLength(2);

    const allCurves = model.getInstancesOf('CURVE', true);
    expect(allCurves).toHaveLength(1);
  });

  it('should create geometric_set with SELECT values', () => {
    const { model, pt1, dir } = setupGeometryModel();

    const { instance: geoSet, diagnostics } = createAndPopulate(
      model,
      'geometric_set',
      {
        name: 'My Set',
        elements: createSet([
          createSelectValue(
            ['GEOMETRIC_SELECT', 'POINT'],
            createRef(pt1.id, 'CARTESIAN_POINT'),
          ),
          createSelectValue(
            ['GEOMETRIC_SELECT', 'DIRECTION'],
            createRef(dir.id, 'DIRECTION'),
          ),
        ]),
      },
    );

    expect(geoSet).toBeDefined();
    expect(diagnostics).toHaveLength(0);
    expect(model.size).toBe(5);
  });

  it('should produce correct instanceToRecord output', () => {
    const { pt1 } = setupGeometryModel();

    const record = instanceToRecord(pt1);
    expect(record.id).toBe(pt1.id);
    expect(record.typeName).toBe('CARTESIAN_POINT');
    expect(record.attributes).toHaveProperty('NAME');
    expect(record.attributes).toHaveProperty('COORDINATES');
    expect(record.attributes['NAME']).toBe('Origin');
  });

  it('should reject abstract entity instantiation', () => {
    const schema = buildTestSchema();
    const model = new StepModel(schema);

    const { instance, diagnostics } = createAndPopulate(
      model,
      'geometric_representation_item',
      { name: 'Abstract' },
    );

    expect(instance).toBeUndefined();
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]!.code).toBe('ABSTRACT_INSTANTIATION');
  });

  it('should report diagnostics for partially invalid createAndPopulate', () => {
    const schema = buildTestSchema();
    const model = new StepModel(schema);

    const { instance, diagnostics } = createAndPopulate(
      model,
      'cartesian_point',
      {
        name: 'P1',
        nonexistent: 42,
      },
    );

    expect(instance).toBeDefined();
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]!.code).toBe('UNKNOWN_ATTRIBUTE');
    expect(getAttribute(instance!, 'NAME')).toBe('P1');
  });
});
