import 'reflect-metadata';
import { Attribute } from '../../decorators';
import { Entity } from '../../named-data-types/entity';
import { NumberType } from '../../simple-data-types';

describe('Attribute decorator', () => {
  class SampleEntity extends Entity {
    @Attribute({ parse: NumberType.parse() })
    public age: NumberType;

    constructor(age: NumberType) {
      super();
      this.age = age;
      this.validate();
    }

    protected validate(): void {
      // Additional validation logic if needed
    }
  }

  test('should define metadata for attribute', () => {
    const entity = new SampleEntity(new NumberType({ value: 25 }));
    const parse = Reflect.getMetadata('attribute:parse', entity, 'age');
    expect(parse).toBeDefined();
    expect(parse(20)).toBeInstanceOf(NumberType);
    expect(parse(20).value).toBe(20);
  });

  test('should define getter and setter for attribute', () => {
    const entity = new SampleEntity(new NumberType({ value: 25 }));
    expect(entity.age).toBeDefined();
    entity.age = new NumberType({ value: 30 });
    expect(entity.age).toBeDefined();
    expect(entity.age.value).toBe(30);
  });
});
