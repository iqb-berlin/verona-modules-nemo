/**
 * Calculates the CSS translate transform for an element to align with a specified drop landing position.
 * @param xyCoords - The comma-separated x,y coordinates (as percentages 0-100) for the drop landing position
 * @param currentButtonCenterX - The x-coordinate of the button's center within its row
 * @param imageWidth - Width of the image in pixels
 * @param imageHeight - Height of the image in pixels
 * @param imageLeft - Left offset of the image relative to the drop container
 * @param imageTop - Top offset of the image relative to the drop container
 * @param currentButtonCenterY - The y-coordinate of the button's center relative to the drop container
 * @returns The CSS translate transform values
 */
export const getDropLandingTranslate = (
  xyCoords: string,
  currentButtonCenterX: number,
  imageWidth: number,
  imageHeight: number,
  imageLeft: number,
  imageTop: number,
  currentButtonCenterY: number
) => {
  const coords = xyCoords.split(',');
  const x = coords[0]?.trim() ?? '50';
  const y = coords[1]?.trim() ?? '50';
  const gapSize = 24; // Gap between buttons in px

  // Calculate target position within the image bounds
  // 0,0 = top-left corner, 50,50 = center, 100,100 = bottom-right corner
  const targetXWithinImage = (parseInt(x, 10) / 100) * imageWidth;
  const targetYWithinImage = (parseInt(y, 10) / 100) * imageHeight;

  // Convert to absolute position by adding image's position
  const absoluteTargetX = imageLeft + targetXWithinImage;
  const absoluteTargetY = imageTop + targetYWithinImage;

  // Calculate movement needed from button's current position
  // The button is already positioned at currentButtonCenterX/Y
  // We need to move it to absoluteTargetX/Y
  const deltaX = absoluteTargetX - currentButtonCenterX + gapSize / 2;
  const deltaY = absoluteTargetY - currentButtonCenterY + gapSize / 2;

  return {
    xPx: `${deltaX}px`,
    yPx: `${deltaY}px`
  };
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
