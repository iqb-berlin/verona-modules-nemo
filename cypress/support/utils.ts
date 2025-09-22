/**
 * Returns the index of an item from an array based on a user-facing index (1-based).
 *
 * Users usually count from 1 (e.g. "1st", "2nd", "3rd"),
 * but JavaScript arrays are 0-based. This helper converts
 * the user index to the correct array index.
 *
 * @param arr - The array to select from
 * @param userIndex - The 1-based index provided by the user (string or number)
 * @returns The item at that position, or undefined if invalid
 */

export const getIndexByOneBasedInput = (
  arr: unknown[],
  userIndex: string | number
): number | undefined => {
  const idx = Number(userIndex) - 1; // convert to 0-based
  if (Number.isNaN(idx) || idx < 0 || idx >= arr.length) {
    return undefined; // invalid input
  }
  return idx; // return 1-based index back
};
