/**
 * This interface is used to represent an attribute.
 */
export interface AttributeBase {
  /**
   * The name is defined as the name of the public property of the entity.
   */
  name: string;
  /**
   * The value of the attribute.
   */
  value: any;
  /**
   * The function used to parse the value of the attribute from JavaScript to STEP.
   */
  parse: (value: any) => any;
}
