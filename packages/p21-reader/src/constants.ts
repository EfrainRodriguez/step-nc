import type {
  ConstantDefinition,
  ExpressSchema,
} from '@step-nc/express-dictionary';

/**
 * Attempt to look up a constant by name in the schema.
 * Returns the definition if found, undefined otherwise.
 * Actual expression evaluation is not performed at read time.
 */
export function findConstant(
  name: string,
  schema: ExpressSchema,
): ConstantDefinition | undefined {
  return schema.constants.get(name.toUpperCase());
}
