/**
 * Calculates the CSS translate transform for an element to align with a specified drop landing position.
 * @param xyCoords - The comma-separated x,y coordinates for the drop landing position.
 * @param currentButtonCenter - The x-coordinate of the button's center within its row.
 * @returns The CSS translate transform string.
 */
export const getDropLandingTranslate = (xyCoords: string, currentButtonCenter: number) => {
  const coords = xyCoords.split(',');
  const x = coords[0]?.trim() ?? '0';
  const y = coords[1]?.trim() ?? '0';

  // The x,y given are an absolute/static position on the image.
  // Parse x into a safe number, default to 0 if not valid
  const landingX = Number.isFinite(Number(x)) ? Number(x) : 0;
  const landingY = Number.isFinite(Number(y)) ? Number(y) : 0;

  // currentButtonCenter is the button center's x within the buttons row.
  // Calculate how far this button must move horizontally to reach the same image x
  const deltaX = landingX - currentButtonCenter;

  // For Y we just use the provided absolute landingY (relative to the same origin as X).
  const xPx = `${deltaX}px`;
  const yPx = `${landingY}px`;

  // return `translate(${xPx}, ${yPx})`;
  return { xPx, yPx };
};

/**
 * Calculate the center position of a button within a row of buttons
 * @param totalButtons total number of buttons in the row
 * @param buttonIndex index of the selected button in the row
 * @returns {currentButtonCenter: number; containerCenter: number; } The center positions of
 * the button and the container
 */
export const calculateButtonCenter = (totalButtons: number, buttonIndex: number):
{ currentButtonCenter: number; containerCenter: number; } => {
  const buttonContainerWidth = 170; // SMALL_SQUARE .animate-wrapper width
  const gapWidth = 24;
  const borderOffset = 8;
  const buttonWidth = buttonContainerWidth - gapWidth;
  const totalWidth = totalButtons * buttonContainerWidth; // Total width of the .buttons-container
  const containerCenter = totalWidth / 2; // Center of buttons-container
  const buttonCenter = buttonWidth / 2; // Distance from container edge to a button center

  // X position of THIS button's center
  const currentButtonCenter = (buttonIndex * buttonContainerWidth) + buttonCenter + borderOffset;

  return {
    currentButtonCenter,
    containerCenter
  };
};
