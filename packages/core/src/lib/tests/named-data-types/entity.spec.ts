import 'reflect-metadata';
import { Entity } from '../../named-data-types';
import { Attribute } from '../../decorators';
import { AttributeBase } from '../../attribute';

describe('Entity', () => {
  class SampleEntity extends Entity {
    @Attribute({ type: 'number' })
    public age: number;

    @Attribute({ type: 'string' })
    public name: string;

    constructor(age: number, name: string) {
      super();
      this.age = age;
      this.name = name;
      this.validate();
    }

    protected validate(): void {
      // Additional validation logic if needed
    }
  }

  test('should create an instance of Entity', () => {
    const entity = new SampleEntity(25, 'John Doe');
    expect(entity).toBeInstanceOf(SampleEntity);
  });

  test('should generate unique IDs for each entity', () => {
    const entity1 = new SampleEntity(25, 'John Doe');
    const entity2 = new SampleEntity(30, 'Jane Doe');
    expect(entity1.id).not.toEqual(entity2.id);
  });

  test('should have a createdAt property with Date type', () => {
    const entity = new SampleEntity(25, 'John Doe');
    expect(entity.createdAt).toBeInstanceOf(Date);
  });

  test('should get class name (instance method)', () => {
    const entity = new SampleEntity(25, 'John Doe');
    const className = entity.getClassName();

    expect(className).toBe('SampleEntity');
  });

  test('should generate attributes based on decorators (instance method)', () => {
    const entity = new SampleEntity(25, 'John Doe');
    const attributes: AttributeBase[] = entity.getAttributes();

    const ageAttribute = attributes.find((attr) => attr.name === 'age');
    const nameAttribute = attributes.find((attr) => attr.name === 'name');

    expect(attributes.length).toBe(2);

    expect(ageAttribute).toEqual({
      name: 'age',
      type: 'number',
      value: 25
    });
    expect(nameAttribute).toEqual({
      name: 'name',
      type: 'string',
      value: 'John Doe'
    });
  });
});
