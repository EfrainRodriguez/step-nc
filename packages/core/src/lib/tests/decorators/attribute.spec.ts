import 'reflect-metadata';
import { Attribute } from '../../decorators';
import { Entity } from '../../named-data-types/entity';
import { STPNumber } from '../../simple-data-types';

describe('Attribute decorator', () => {
  class SampleEntity extends Entity {
    @Attribute({ parse: STPNumber.parse() })
    public age: STPNumber;

    constructor(age: STPNumber) {
      super();
      this.age = age;
      this.validate();
    }

    protected validate(): void {
      // Additional validation logic if needed
    }
  }

  test('should define metadata for attribute', () => {
    const entity = new SampleEntity(new STPNumber(25));
    const parse = Reflect.getMetadata('attribute:parse', entity, 'age');
    expect(parse).toBeDefined();
    expect(parse(20)).toBeInstanceOf(STPNumber);
    expect(parse(20).value).toBe(20);
  });

  test('should define getter and setter for attribute', () => {
    const entity = new SampleEntity(new STPNumber(25));
    expect(entity.age).toBeDefined();
    entity.age = new STPNumber(30);
    expect(entity.age).toBeDefined();
    expect(entity.age.value).toBe(30);
  });
});
