/**
 * EXPRESS provides several built-in constants, which are defined here.
 * NOTE The built-in constants are considered to have exact values, even though such a value might not
 * be representable on a computer.
 * @see ISO-10303-11:2004 section 14 Built-in constants
 */

/**
 * CONST_E is a real constant representing the mathematical value e, the base of the natural
 * logarithm function (ln).
 * @see ISO-10303-11:2004 section 14.1 Constant e
 */
export const CONST_E = Math.E;

/**
 * The indeterminate symbol (?) stands for an ambiguous value. It is compatible with all data
 * types.
 * NOTE The most common use of indeterminate (?) is as the upper bound specification of a bag, list or
 * set. This usage represents the notion that the size of the aggregate value defined by the aggregation data
 * type is unbounded.
 * @see ISO-10303-11:2004 section 14.2 Indeterminate
 * 
 * NOTICE: ? symbol is not allwed as a variable name in TypeScript so we use INDETERMINATE instead of ?.
 */
export const INDETERMINATE = undefined;

/**
 * FALSE is a LOGICAL constant representing the logical notion of falsehood. It is compatible with
 * the BOOLEAN and LOGICAL data types.
 * @see ISO-10303-11:2004 section 14.3 False
 */
export const FALSE = false;

/**
 * PI is a REAL constant representing the mathematical value π, the ratio of a circle’s circumference
 * to its diameter.
 * @see ISO-10303-11:2004 section 14.4 Pi
 */
export const CONST_PI = Math.PI;

/**
 * SELF refers to the current entity instance or type value. SELF may appear within an entity
 * declaration, a type declaration or an entity constructor.
 * NOTE self is not a constant, but behaves as one in every context in which it can appear.
 * @see ISO-10303-11:2004 section 14.5 Self
 * 
 * NOTICE: In the context of TypeScript, 'self' can be represented as 'this' keyword assuming that
 * the context is a class or an object.
 */

/**
 * TRUE is a LOGICAL constant representing the logical notion of truth. It is compatible with the
 * BOOLEAN and LOGICAL data types.
 * @see ISO-10303-11:2004 section 14.6 True
 */
export const TRUE = true;

/**
 * UNKNOWN is a LOGICAL constant representing that there is insufficient information available to
 * be able to evaluate a logical condition. It is compatible with the LOGICAL data type, but not
 * with the BOOLEAN data type.
 * @see ISO-10303-11:2004 section 14.7 Unknown 
 */
export const UNKNOWN = undefined;
