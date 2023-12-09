import { AttributeBase } from '../interfaces';
import { generateUUID } from '../utils';

/**
 * An entity identifier is a string of characters that is used to identify an entity data type.
 */
export type EntityId = string;

/**
 * Entity data types are established by entity declarations (see 9.2). An entity data type is
 * assigned an entity identifier by the user. An entity data type is referenced by this identifier.
 * @see ISO-10303-11:2004 8.3.1 Entity data type
 */
export abstract class Entity {
  protected readonly _id: EntityId;
  protected readonly _createdAt: Date;

  constructor() {
    this._id = generateUUID();
    this._createdAt = new Date();
  }

  get id(): EntityId {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  public getClassName(): string {
    return this.constructor.name;
  }

  public getAttributes(): AttributeBase[] {
    const attrs: AttributeBase[] = [];
    const prototype = Object.getPrototypeOf(this);
    Object.entries(prototype).forEach(([key, value]) => {
      if (!key.startsWith('_')) {
        attrs.push({
          value,
          name: key,
          type: Reflect.getMetadata('attribute:type', prototype, key)
        });
      }
    });
    return attrs;
  }

  protected abstract validate(): void;
}
