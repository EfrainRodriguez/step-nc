import { Entity } from '../named-data-types/entity';

/**
 * This interface defines the structure of parameters for the decorator @Attribute.
 */
export interface AttributeOptions {
  type: string;
}

/**
 * The decorator @Attribute is used to define the type of an attribute of an entity data type.
 * @param type The type of the attribute as string.
 */
export const Attribute = <T>({ type }: AttributeOptions) => {
  return (target: Entity, key: string | symbol) => {
    let value: T;

    Reflect.defineMetadata('attribute:type', type, target, key);

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
