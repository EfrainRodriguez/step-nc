import 'reflect-metadata';
import { Entity } from '../../named-data-types';
import { Attribute } from '../../decorators';
import { AttributeBase } from '../../interfaces';
import { STPNumber, STPString } from '../../simple-data-types';
import { STPList } from '../../aggregation-data-types';

describe('Entity', () => {
  class SampleEntity extends Entity {
    @Attribute({ parse: STPNumber.parse() })
    public age: STPNumber;

    @Attribute({ parse: STPString.parse({ maxLength: 256 }) })
    public name: STPString;

    @Attribute({
      parse: STPList.parse(STPList.parse(STPString.parse({ maxLength: 256 })))
    })
    public text: STPList<STPList<STPString>>;

    constructor(
      age: STPNumber,
      name: STPString,
      text: STPList<STPList<STPString>>
    ) {
      super();
      this.age = age;
      this.name = name;
      this.text = text;
      this.validate();
    }

    protected validate(): void {
      // Additional validation logic if needed
    }
  }

  const entity = new SampleEntity(
    new STPNumber(25),
    new STPString('John Doe'),
    new STPList<STPList<STPString>>([
      new STPList<STPString>([new STPString('Hello')]),
      new STPList<STPString>([new STPString('World')])
    ])
  );

  test('should create an instance of Entity', () => {
    expect(entity).toBeInstanceOf(SampleEntity);
  });

  test('should generate unique IDs for each entity', () => {
    const entity2 = new SampleEntity(
      new STPNumber(25),
      new STPString('John Doe'),
      new STPList<STPList<STPString>>([
        new STPList<STPString>([new STPString('Hello')]),
        new STPList<STPString>([new STPString('World')])
      ])
    );
    expect(entity.id).not.toEqual(entity2.id);
  });

  test('should have a createdAt property with Date type', () => {
    expect(entity.createdAt).toBeInstanceOf(Date);
  });

  test('should get class name', () => {
    const className = entity.getClassName();
    expect(className).toBe('SampleEntity');
  });

  test('should generate attributes based on decorators', () => {
    const attributes: AttributeBase[] = entity.getAttributes();

    const ageAttribute = attributes.find((attr) => attr.name === 'age');
    const nameAttribute = attributes.find((attr) => attr.name === 'name');
    const textAttribute = attributes.find((attr) => attr.name === 'text');

    expect(attributes.length).toBe(3);

    expect(ageAttribute?.name).toBe('age');
    expect(ageAttribute?.value).toEqual(new STPNumber(25));
    expect(ageAttribute?.parse).toBeDefined();
    expect(ageAttribute?.parse(20)).toBeInstanceOf(STPNumber);
    expect(ageAttribute?.parse(20).value).toBe(20);

    expect(nameAttribute?.name).toBe('name');
    expect(nameAttribute?.value).toEqual(new STPString('John Doe'));
    expect(nameAttribute?.parse).toBeDefined();
    expect(nameAttribute?.parse('John Doe')).toBeInstanceOf(STPString);
    expect(nameAttribute?.parse('John Doe').value).toBe('John Doe');

    expect(textAttribute?.name).toBe('text');
    expect(textAttribute?.value).toEqual(
      new STPList<STPList<STPString>>([
        new STPList<STPString>([new STPString('Hello')]),
        new STPList<STPString>([new STPString('World')])
      ])
    );
    expect(textAttribute?.parse).toBeDefined();
    const text = [['Hello'], ['World']];
    expect(textAttribute?.parse(text)).toBeInstanceOf(STPList);
    expect(textAttribute?.parse(text).getItems().length).toBe(2);
    expect(textAttribute?.parse(text).getItems()[0]).toBeInstanceOf(STPList);
    expect(
      textAttribute?.parse(text).getItems()[0].getItems()[0]
    ).toBeInstanceOf(STPString);
    expect(textAttribute?.parse(text).getItems()[0].getItems()[0].value).toBe(
      'Hello'
    );
  });
});
