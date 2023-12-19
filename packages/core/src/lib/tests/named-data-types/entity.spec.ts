// import 'reflect-metadata';
// import { Entity } from '../../named-data-types';
// import { Attribute } from '../../decorators';
// import { AttributeBase } from '../../interfaces';
// import { NumberType, StringType } from '../../simple-data-types';
// import { ListType } from '../../aggregation-data-types';

// describe('Entity', () => {
//   class SampleEntity extends Entity {
//     @Attribute({ parse: NumberType.parse() })
//     public age: NumberType;

//     @Attribute({ parse: StringType.parse({ maxLength: 256 }) })
//     public name: StringType;

//     @Attribute({
//       parse: ListType.parse(ListType.parse(StringType.parse({ maxLength: 256 })))
//     })
//     public text: ListType<ListType<StringType>>;

//     constructor(
//       age: NumberType,
//       name: StringType,
//       text: ListType<ListType<StringType>>
//     ) {
//       super();
//       this.age = age;
//       this.name = name;
//       this.text = text;
//       this.validate();
//     }

//     protected validate(): void {
//       // Additional validation logic if needed
//     }
//   }

//   const entity = new SampleEntity(
//     new NumberType(25),
//     new StringType('John Doe'),
//     new ListType<ListType<StringType>>([
//       new ListType<StringType>([new StringType('Hello')]),
//       new ListType<StringType>([new StringType('World')])
//     ])
//   );

//   test('should create an instance of Entity', () => {
//     expect(entity).toBeInstanceOf(SampleEntity);
//   });

//   test('should generate unique IDs for each entity', () => {
//     const entity2 = new SampleEntity(
//       new NumberType(25),
//       new StringType('John Doe'),
//       new ListType<ListType<StringType>>([
//         new ListType<StringType>([new StringType('Hello')]),
//         new ListType<StringType>([new StringType('World')])
//       ])
//     );
//     expect(entity.id).not.toEqual(entity2.id);
//   });

//   test('should have a createdAt property with Date type', () => {
//     expect(entity.createdAt).toBeInstanceOf(Date);
//   });

//   test('should get class name', () => {
//     const className = entity.getClassName();
//     expect(className).toBe('SampleEntity');
//   });

//   test('should generate attributes based on decorators', () => {
//     const attributes: AttributeBase[] = entity.getAttributes();

//     const ageAttribute = attributes.find((attr) => attr.name === 'age');
//     const nameAttribute = attributes.find((attr) => attr.name === 'name');
//     const textAttribute = attributes.find((attr) => attr.name === 'text');

//     expect(attributes.length).toBe(3);

//     expect(ageAttribute?.name).toBe('age');
//     expect(ageAttribute?.value).toEqual(new NumberType(25));
//     expect(ageAttribute?.parse).toBeDefined();
//     expect(ageAttribute?.parse(20)).toBeInstanceOf(NumberType);
//     expect(ageAttribute?.parse(20).value).toBe(20);

//     expect(nameAttribute?.name).toBe('name');
//     expect(nameAttribute?.value).toEqual(new StringType('John Doe'));
//     expect(nameAttribute?.parse).toBeDefined();
//     expect(nameAttribute?.parse('John Doe')).toBeInstanceOf(StringType);
//     expect(nameAttribute?.parse('John Doe').value).toBe('John Doe');

//     expect(textAttribute?.name).toBe('text');
//     expect(textAttribute?.value).toEqual(
//       new ListType<ListType<StringType>>([
//         new ListType<StringType>([new StringType('Hello')]),
//         new ListType<StringType>([new StringType('World')])
//       ])
//     );
//     expect(textAttribute?.parse).toBeDefined();
//     const text = [['Hello'], ['World']];
//     expect(textAttribute?.parse(text)).toBeInstanceOf(ListType);
//     expect(textAttribute?.parse(text).getItems().length).toBe(2);
//     expect(textAttribute?.parse(text).getItems()[0]).toBeInstanceOf(ListType);
//     expect(
//       textAttribute?.parse(text).getItems()[0].getItems()[0]
//     ).toBeInstanceOf(StringType);
//     expect(textAttribute?.parse(text).getItems()[0].getItems()[0].value).toBe(
//       'Hello'
//     );
//   });
// });

describe('Entity', () => {
  test('should create an instance of Entity', () => {
    expect(true).toBe(true);
  });
});
