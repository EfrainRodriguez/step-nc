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

  /**
   * Creates an instance of entity. The entity identifier is generated automatically.
   */
  constructor() {
    this._id = generateUUID();
    this._createdAt = new Date();
  }

  /**
   * Returns the entity identifier.
   */
  get id(): EntityId {
    return this._id;
  }

  /**
   * Returns the creation date of the entity.
   */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Returns the name of the entity data type.
   */
  public getClassName(): string {
    return this.constructor.name;
  }

  /**
   * Returns the attributes of the entity. The attributes are defined as public properties of the
   * entity data type. Each attribute is defined by the decorator @Attribute.
   */
  public getAttributes(): AttributeBase[] {
    const attrs: AttributeBase[] = [];
    const prototype = Object.getPrototypeOf(this);
    Object.entries(prototype).forEach(([key, value]) => {
      if (!key.startsWith('_')) {
        attrs.push({
          value,
          name: key,
          parse: Reflect.getMetadata('attribute:parse', prototype, key)
        });
      }
    });
    return attrs;
  }

  protected abstract validate(): void;
}
