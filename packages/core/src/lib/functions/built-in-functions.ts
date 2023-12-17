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
export const ABS = Math.abs;

/**
 * FUNCTION ACOS ( V:NUMBER ) : REAL; 
 * The ACOS function returns the angle given a cosine value
 * Parameters : V is a number which is the cosine of an angle.
 * Result : The angle in radians (0 ≤ result ≤ π) whose cosine is V.
 * Conditions : −1.0 ≤ V ≤ 1.0
 * EXAMPLE ACOS ( 0.3 ) --> 1.266103...
 * @see ISO-10303-11:2004 section 15.2 Acos - arithmetic function
 */
export const ACOS = Math.acos;

/**
 * FUNCTION ASIN ( V:NUMBER ) : REAL; 
 * The ASIN function returns the angle given a sine value
 * Parameters : V is a number which is the sine of an angle.
 * Result : The angle in radians (-π/2 ≤ result ≤ π/2) whose sine is V.
 * Conditions : −1.0 ≤ V ≤ 1.0
 * EXAMPLE ASIN ( 0.3 ) --> 3.04692...e-1
 * @see ISO-10303-11:2004 section 15.3 Asin - arithmetic function
 */
export const ASIN = Math.asin;

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
export const ATAN = Math.atan;
