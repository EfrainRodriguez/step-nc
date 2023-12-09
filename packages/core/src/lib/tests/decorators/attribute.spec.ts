import 'reflect-metadata';
import { Attribute } from '../../decorators';
import { Entity } from '../../named-data-types/entity';

describe('Attribute decorator', () => {
  class SampleEntity extends Entity {
    @Attribute({ type: 'number' })
    public age: number;

    constructor(age: number) {
      super();
      this.age = age;
      this.validate();
    }

    protected validate(): void {
      // Additional validation logic if needed
    }
  }
  test('should define metadata for attribute type', () => {
    const type = Reflect.getMetadata(
      'attribute:type',
      SampleEntity.prototype,
      'age'
    );

    expect(type).toBe('number');
  });

  test('should define getter and setter for attribute', () => {
    const entity = new SampleEntity(25);

    entity.age = 25;

    expect(entity.age).toBe(25);
  });
});
