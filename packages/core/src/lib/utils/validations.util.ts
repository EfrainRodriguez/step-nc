export const isValidNumber = (value: number): boolean => {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return false;
  }
  return true;
};

export const isValidRealPrecision = (precision: number): boolean => {
  const minPrecision = 0;
  const maxPrecision = 14;

  return (
    isValidNumber(precision) &&
    Number.isInteger(precision) &&
    precision >= minPrecision &&
    precision <= maxPrecision
  );
};

export const isValidStringMaxLength = (length: number): boolean => {
  const minLength = 0;

  return (
    isValidNumber(length) && Number.isInteger(length) && length >= minLength
  );
};

export const isValidAggregationLowerBound = (lowerBound: number): boolean => {
  const minLowerBound = 0;

  return (
    isValidNumber(lowerBound) &&
    Number.isInteger(lowerBound) &&
    lowerBound >= minLowerBound
  );
};

export const isValidAggregationUpperBound = (upperBound: number): boolean => {
  const minUpperBound = 1;

  return (
    isValidNumber(upperBound) &&
    Number.isInteger(upperBound) &&
    upperBound >= minUpperBound
  );
};
