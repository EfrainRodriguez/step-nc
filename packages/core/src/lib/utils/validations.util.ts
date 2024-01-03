import * as _ from 'lodash';

export const isValidNumber = (value: number): boolean => {
  return _.isNumber(value) && isFinite(value) && !isNaN(value);
};

export const isValidRealPrecision = (precision: number): boolean => {
  const minPrecision = 0;
  const maxPrecision = 14; // max decimal digits in a number in JS

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

export const isValidAggregationIndex = (lowerBound: number): boolean => {
  return isValidNumber(lowerBound) && Number.isInteger(lowerBound);
};
