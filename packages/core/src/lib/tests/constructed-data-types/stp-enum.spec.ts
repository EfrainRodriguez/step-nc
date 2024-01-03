import { STPEnum } from '../../constructed-data-types';
import { InvalidDataTypeException } from '../../exceptions';

describe('STPEnum', () => {
  test('should construct a STPEnum with an uppercase string', () => {
    const stpEnum: STPEnum<'a' | 'b'> = new STPEnum('A');
    expect(stpEnum).toBeInstanceOf(STPEnum);
    expect(stpEnum.value).toBe('A');
  });

  test('should set a new value to the STPEnum', () => {
    const stpEnum: STPEnum<'a' | 'b'> = new STPEnum('A');
    stpEnum.value = 'B';
    expect(stpEnum.value).toBe('B');
  });

  test('should throw an InvalidDataTypeException if the value is not uppercase', () => {
    expect(() => new STPEnum<'A' | 'B'>('a' as 'A')).toThrow(
      InvalidDataTypeException
    );
  });
});
