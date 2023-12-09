import { Entity } from '../named-data-types/entity';

export interface AttributeOptions {
  type: string;
}

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
