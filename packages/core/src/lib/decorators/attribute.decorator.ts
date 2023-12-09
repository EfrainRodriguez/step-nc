import { Entity } from '../named-data-types/entity';

export interface AttributeOptions {
  name?: string;
  type: string;
}

export const Attribute = <T>({ type, name }: AttributeOptions) => {
  return (target: Entity, key: string | symbol) => {
    let value: T;
    key = name || key;

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
