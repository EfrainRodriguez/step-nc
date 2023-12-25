import {
  NumberType,
  RealType,
  BinaryType,
  IntegerType,
  BooleanType
} from '../simple-data-types';

/**
 * All functions (and mathematical operations in general) are assumed to evaluate to exact results.
 * All built-in functions will return an indeterminate (?) result if passed an indeterminate (?)
 * parameter unless explicitly specified otherwise in the description of the function.
 * The prototype for each of the built-in functions is given to show the type of the formal parameters
 * and the result.
 * @see ISO-10303-11:2004 section 15 Built-in functions
 */

/**
 * FUNCTION ABS ( V:NUMBER ) : NUMBER;
 * The ABS function returns the absolute value of a number.
 * Parameters : V is a number.
 * Result : The absolute value of V. The returned data type is identical to the data type of V.
 * EXAMPLE ABS ( -10 ) --> 10
 * @see ISO-10303-11:2004 section 15.1 Abs - arithmetic function
 */
export const abs = (v: NumberType): NumberType =>
  new NumberType({ value: Math.abs(v.value) });

/**
 * FUNCTION ACOS ( V:NUMBER ) : REAL;
 * The ACOS function returns the angle given a cosine value
 * Parameters : V is a number which is the cosine of an angle.
 * Result : The angle in radians (0 ≤ result ≤ π) whose cosine is V.
 * Conditions : −1.0 ≤ V ≤ 1.0
 * EXAMPLE ACOS ( 0.3 ) --> 1.266103...
 * @see ISO-10303-11:2004 section 15.2 Acos - arithmetic function
 */
export const aCos = (v: NumberType): RealType =>
  new RealType({ value: Math.acos(v.value) });

/**
 * FUNCTION ASIN ( V:NUMBER ) : REAL;
 * The ASIN function returns the angle given a sine value
 * Parameters : V is a number which is the sine of an angle.
 * Result : The angle in radians (-π/2 ≤ result ≤ π/2) whose sine is V.
 * Conditions : −1.0 ≤ V ≤ 1.0
 * EXAMPLE ASIN ( 0.3 ) --> 3.04692...e-1
 * @see ISO-10303-11:2004 section 15.3 Asin - arithmetic function
 */
export const aSin = (v: NumberType): RealType =>
  new RealType({ value: Math.asin(v.value) });

/**
 * FUNCTION ATAN ( V1:NUMBER; V2:NUMBER ) : REAL;
 * The ATAN function returns the angle given a tangent value of V , where V is given by the
 * expression V = V 1/V 2.
 * Parameters :
 * a) V1 is a number.
 * b) V2 is a number.
 * Result : The angle in radians (-π/2 ≤ result ≤ π/2) whose tangent is V. If V2 is zero, the result
 * is π/2 or -π/2 depending on the sign of V1.
 * Conditions : Both V1 and V2 shall not be zero.
 * EXAMPLE ATAN ( -5.5, 3.0 ) --> -1.071449...
 * @see ISO-10303-11:2004 section 15.4 Atan - arithmetic function
 */
export const aTan = (v1: NumberType, v2: NumberType): RealType =>
  new RealType({ value: Math.atan(v1.value / v2.value) });

/**
 * FUNCTION BLENGTH ( V:BINARY ) : INTEGER;
 * The blength function returns the number of bits in a binary.
 * Parameters : V is a binary value.
 * Result : The returned value is the actual number of bits in the binary value passed.
 * EXAMPLE Use of the blength function.
 * LOCAL
 * n : NUMBER;
 * x : BINARY := %01010010 ;
 * END_LOCAL;
 * ...
 * n := BLENGTH ( x ); -- n is assigned the value 8
 */
export const bLength = (v: BinaryType): IntegerType =>
  new IntegerType({ value: v.value.length });

/**
 * FUNCTION COS ( V:NUMBER ) : REAL;
 * The cos function returns the cosine of an angle.
 * Parameters : V is a number which is an angle in radians.
 * Result : The cosine of V (-1.0 ≤ result ≤ 1.0).
 * EXAMPLE COS ( 0.5 ) --> 8.77582...E-1
 */
export const cos = (v: NumberType): RealType =>
  new RealType({ value: Math.cos(v.value) });

/**
 * FUNCTION EXISTS ( V:GENERIC ) : BOOLEAN;
 * The exists function returns true if a value exists for the input parameter, or false if no value
 * exists for it. The exists function is useful for checking if values have been given to optional
 * attributes, or if variables have been initialized.
 * Parameters : V is an expression which results in any type.
 * Result : true or false depending on whether V has an actual or indeterminate (?) value.
 * EXAMPLE IF EXISTS ( a ) THEN ...
 */
export const exists = <T>(v: T): BooleanType =>
  new BooleanType({ value: v !== undefined });

/**
 * FUNCTION EXP ( V:NUMBER ) : REAL;
 * The exp function returns e (the base of the natural logarithm system) raised to the power V.
 * Parameters : V is a number.
 * Result : The value e^V.
 * EXAMPLE EXP ( 10 ) --> 2.202646...E+4
 */
export const exp = (v: NumberType): RealType =>
  new RealType({ value: Math.exp(v.value) });
