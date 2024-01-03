import { STPSelect } from '../../constructed-data-types';
import { Entity } from '../../named-data-types';
import { InvalidDataTypeException } from '../../exceptions';

describe('STPSelect', () => {
  class A extends Entity {
    constructor() {
      super();
    }

    public validate(): void {
      // empty
    }
  }

  class B extends Entity {
    constructor() {
      super();
    }

    public validate(): void {
      // empty
    }
  }

  test('should construct a STPSelect with a valid entity', () => {
    const stpSelect: STPSelect<A | B> = new STPSelect(new A());
    expect(stpSelect).toBeInstanceOf(STPSelect);
    expect(stpSelect.value).toBeInstanceOf(A);
  });

  test('should set a new value to the STPSelect', () => {
    const stpSelect: STPSelect<A | B> = new STPSelect(new A());
    stpSelect.value = new B();
    expect(stpSelect.value).toBeInstanceOf(B);
  });

  test('should throw an InvalidDataTypeException if the value is not an entity', () => {
    expect(() => new STPSelect<A | B>({} as A)).toThrow(
      InvalidDataTypeException
    );
  });
});
