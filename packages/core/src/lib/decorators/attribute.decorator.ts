import { Entity } from '../named-data-types/entity';

/**
 * This interface defines the structure of parameters for the decorator @Attribute.
 */
export interface AttributeOptions {
  parse: (value: any) => any;
}

/**
 * The decorator @Attribute is used to define the type of an attribute of an entity data type.
 * @param parse The function used to parse the value of the attribute from JavaScript to STEP.
 */
export const Attribute = <T>({ parse }: AttributeOptions) => {
  return (target: Entity, key: string | symbol) => {
    let value: T;

    Reflect.defineMetadata('attribute:parse', parse, target, key);

    const getter = function (): T {
      return value;
    };

    const setter = function (newVal: T): void {
      value = newVal;
    };

    Object.defineProperty(target, key, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true
    });
  };
};
