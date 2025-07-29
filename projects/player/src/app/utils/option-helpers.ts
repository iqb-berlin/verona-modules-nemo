import { NumberedOption } from '../models/unit-definition';

export function createNumberedOptions(numberOfOptions: number): NumberedOption[] {
  return Array.from(
    { length: numberOfOptions },
    (_, index) => ({
      id: index,
      text: (index + 1).toString()
    })
  );
}
