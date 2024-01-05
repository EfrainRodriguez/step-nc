import {
  NumberType,
  RealType,
  BinaryType,
  IntegerType,
  BooleanType,
  StringType
} from '../simple-data-types';
import {
  AggregationType,
  ArrayType,
  VariableSizeAggregationType
} from '../aggregation-data-types';
import { InvalidDataTypeException } from '../exceptions';

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
 * @see ISO-10303-11:2004 section 15.5 Blength - binary function
 */
export const bLength = (v: BinaryType): IntegerType =>
  new IntegerType({ value: v.value.length });

/**
 * FUNCTION COS ( V:NUMBER ) : REAL;
 * The cos function returns the cosine of an angle.
 * Parameters : V is a number which is an angle in radians.
 * Result : The cosine of V (-1.0 ≤ result ≤ 1.0).
 * EXAMPLE COS ( 0.5 ) --> 8.77582...E-1
 * @see ISO-10303-11:2004 section 15.6 Cos - arithmetic function
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
 * @see ISO-10303-11:2004 section 15.7 Exists - general function
 */
export const exists = <T>(v: T): BooleanType =>
  new BooleanType({ value: v !== undefined });

/**
 * FUNCTION EXP ( V:NUMBER ) : REAL;
 * The exp function returns e (the base of the natural logarithm system) raised to the power V.
 * Parameters : V is a number.
 * Result : The value e^V.
 * EXAMPLE EXP ( 10 ) --> 2.202646...E+4
 * @see ISO-10303-11:2004 section 15.8 Exp - arithmetic function
 */
export const exp = (v: NumberType): RealType =>
  new RealType({ value: Math.exp(v.value) });

/**
 * FUNCTION HIBOUND ( V:AGGREGATE OF GENERIC ) : INTEGER;
 * The hibound function returns the declared upper index of an array or the declared upper
 * bound of a bag, list or set.
 * Parameters : V is an aggregate value.
 * Result :
 * a) When V is an array the returned value is the declared upper index.
 * b) When V is a bag, list or set the returned value is the declared upper bound; if there are
 * no bounds declared or the upper bound is declared to be indeterminate (?) indeterminate
 * (?) is returned.
 * EXAMPLE Usage of hibound function on nested aggregate values.
 * LOCAL
 * a : ARRAY[-3:19] OF SET[2:4] OF LIST[0:?] OF INTEGER;
 * h1, h2, h3 : INTEGER;
 * END_LOCAL;
 * ...
 * a[-3][1][1] := 2; -- places a value in the list
 * ...
 * h1 := HIBOUND(a); -- =19 (upper bound of array)
 * h2 := HIBOUND(a[-3]); -- = 4 (upper bound of set)
 * h3 := HIBOUND(a[-3][1]); -- = ? (upper bound of list (unbounded))
 * @see ISO-10303-11:2004 section 15.10 Hibound - arithmetic function
 */
export const hiBound = <T>(v: AggregationType<T>): IntegerType => {
  if (v instanceof ArrayType) {
    return new IntegerType({ value: v.upperIndex });
  } else if (v instanceof VariableSizeAggregationType) {
    return new IntegerType({
      value: v.upperIndex as number
    });
  }
  throw new InvalidDataTypeException(
    v,
    `Invalid data type for hibound function: ${v.constructor.name}`
  );
};

/**
 * FUNCTION HIINDEX ( V:AGGREGATE OF GENERIC ) : INTEGER;
 * The hiindex function returns the upper index of an array or the number of elements in a bag,
 * list or set.
 * Parameters : V is an aggregate value.
 * Result :
 * a) When V is an array, the returned value is the declared upper index.
 * b) When V is a bag, list or set, the returned value is the actual number of elements in the
 * aggregate value.
 * EXAMPLE Usage of hiindex function on nested aggregate values.
 * LOCAL
 * a : ARRAY[-3:19] OF SET[2:4] OF LIST[0:?] OF INTEGER;
 * h1, h2, h3 : INTEGER;
 * END_LOCAL;
 * a[-3][1][1] := 2; -- places a value in the list
 * h1 := HIINDEX(a); -- = 19 (upper bound of array)
 * h2 := HIINDEX(a[-3]); -- = 1 (size of set) -- this is invalid with respect
 * -- to the bounds on the SET
 * h3 := HIINDEX(a[-3][1]); -- = 1 (size of list)
 * @see ISO-10303-11:2004 section 15.11 Hiindex - arithmetic function
 */
export const hiIndex = <T>(v: AggregationType<T>): IntegerType => {
  if (v instanceof ArrayType) {
    return new IntegerType({ value: v.upperIndex });
  } else if (v instanceof VariableSizeAggregationType) {
    return new IntegerType({
      value: v.size
    });
  }
  throw new InvalidDataTypeException(
    v,
    `Invalid data type for hiindex function: ${v.constructor.name}`
  );
};

/**
 * FUNCTION LENGTH ( V:STRING ) : INTEGER;
 * The length function returns the number of characters in a string.
 * Parameters : V is a string value.
 * Result : The returned value is the number of characters in the string and shall be greater than
 * or equal to zero.
 * EXAMPLE Usage of the length function.
 * LOCAL
 * n : NUMBER;
 * x1 : STRING := ’abc’;
 * x2 : STRING := "0000795E00006238";
 * END_LOCAL;
 * ...
 * n := LENGTH ( x1 ); -- n is assigned the value 3
 * n := LENGTH ( x2 ); -- n is assigned the value 2
 * @see ISO-10303-11:2004 section 15.12 Length - string function
 */
export const length = (v: StringType): IntegerType =>
  new IntegerType({ value: v.value.length });

/**
 * FUNCTION LOBOUND ( V:AGGREGATE OF GENERIC ) : INTEGER;
 * The lobound function returns the declared lower index of an array, or the declared lower
 * bound of a bag, list or set.
 * Parameters : V is an aggregate value.
 * Result :
 * a) When V is an array the returned value is the declared lower index.
 * b) When V is a bag, list or set the returned value is the declared lower bound; if no lower
 * bound is declared, zero (0) is returned.
 * EXAMPLE Usage of lobound function on nested aggregate values.
 * LOCAL
 * a : ARRAY[-3:19] OF SET[2:4] OF LIST[0:?] OF INTEGER;
 * h1, h2, h3 : INTEGER;
 * END_LOCAL;
 * ...
 * h1 := LOBOUND(a); -- =-3 (lower index of array)
 * h2 := LOBOUND(a[-3]); -- = 2 (lower bound of set)
 * h3 := LOBOUND(a[-3][1]); -- = 0 (lower bound of list)
 * @see ISO-10303-11:2004 section 15.13 Lobound - arithmetic function
 */
export const loBound = <T>(v: AggregationType<T>): IntegerType => {
  if (v instanceof ArrayType) {
    return new IntegerType({ value: v.lowerIndex });
  } else if (v instanceof VariableSizeAggregationType) {
    return new IntegerType({
      value: v.lowerIndex === undefined ? 0 : v.lowerIndex
    });
  }
  throw new InvalidDataTypeException(
    v,
    `Invalid data type for lobound function: ${v.constructor.name}`
  );
};

/**
 * 15.14 Log - arithmetic function
 * FUNCTION LOG ( V:NUMBER ) : REAL;
 * The log function returns the natural logarithm of a number.
 * Parameters : V is a number.
 * Result : A real number which is the natural logarithm of V.
 * Conditions : V > 0.0
 * EXAMPLE LOG ( 4.5 ) --> 1.504077...E0
 * @see ISO-10303-11:2004 section 15.14 Log - arithmetic function
 */
export const log = (v: NumberType): RealType =>
  new RealType({ value: Math.log(v.value) });

/**
 * 15.15 Log2 - arithmetic function
 * FUNCTION LOG2 ( V:NUMBER ) : REAL;
 * The log2 function returns the base two logarithm of a number.
 * Parameters : V is a number.
 * Result : A real number which is the base two logarithm of V.
 * Conditions : V > 0.0
 * EXAMPLE LOG2 ( 8 ) --> 3.00...E0
 * @see ISO-10303-11:2004 section 15.15 Log2 - arithmetic function
 */
export const log2 = (v: NumberType): RealType =>
  new RealType({ value: Math.log2(v.value) });

/**
 * 15.16 Log10 - arithmetic function
 * FUNCTION LOG10 ( V:NUMBER ) : REAL;
 * The log10 function returns the base ten logarithm of a number.
 * Parameters : V is a number.
 * Result : A real number which is the base ten logarithm of V.
 * Conditions : V > 0.0
 * EXAMPLE LOG10 ( 10 ) --> 1.00...E0
 * @see ISO-10303-11:2004 section 15.16 Log10 - arithmetic function
 */
export const log10 = (v: NumberType): RealType =>
  new RealType({ value: Math.log10(v.value) });

/**
 * 15.17 LoIndex - arithmetic function
 * FUNCTION LOINDEX ( V:AGGREGATE OF GENERIC ) : INTEGER;
 * The loindex function returns the lower index of an aggregate value.
 * Parameters : V is an aggregate value
 * Result :
 * a) When V is an array the returned value is the declared lower index.
 * b) When V is a bag, list or set, the returned value is 1 (one).
 * EXAMPLE Usage of loindex function on nested aggregate values.
 * LOCAL
 * a : ARRAY[-3:19] OF SET[2:4] OF LIST[0:?] OF INTEGER;
 * h1, h2, h3 : INTEGER;
 * END_LOCAL;
 * ...
 * h1 := LOINDEX(a); -- =-3 (lower bound of array)
 * h2 := LOINDEX(a[-3]); -- = 1 (for set)
 * h3 := LOINDEX(a[-3][1]); -- = 1 (for list)
 * @see ISO-10303-11:2004 section 15.17 LoIndex - arithmetic function
 */
export const loIndex = <T>(v: AggregationType<T>): IntegerType => {
  if (v instanceof ArrayType) {
    return new IntegerType({ value: v.lowerIndex });
  } else if (v instanceof VariableSizeAggregationType) {
    return new IntegerType({
      value: 1
    });
  }
  throw new InvalidDataTypeException(
    v,
    `Invalid data type for loindex function: ${v.constructor.name}`
  );
}
