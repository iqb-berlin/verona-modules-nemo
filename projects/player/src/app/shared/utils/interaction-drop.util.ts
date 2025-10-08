/**
 * Calculates the CSS translate transform for an element to align with a specified drop landing position.
 * @param xyCoords - The comma-separated x,y coordinates (as percentages 0-100) for the drop landing position
 * @param currentButtonCenter - The x-coordinate of the button's center within its row
 * @param imageWidth - Width of the image in pixels
 * @param imageHeight - Height of the image in pixels
 * @param imageLeft - Left offset of the image relative to the drop container
 * @param imageTop - Top offset of the image relative to the drop container
 * @param buttonY - Current Y position of the button relative to the drop container
 * @returns The CSS translate transform values
 */
export const getDropLandingTranslate = (
  xyCoords: string,
  currentButtonCenter: number,
  imageWidth: number,
  imageHeight: number,
  imageLeft: number,
  imageTop: number,
  buttonY: number
) => {
  const coords = xyCoords.split(',');
  const x = coords[0]?.trim() ?? '50';
  const y = coords[1]?.trim() ?? '50';

  // Parse percentages (0-100) where image's top-left is always (0,0)
  const percentX = Math.max(0, Math.min(100, parseFloat(x)));
  const percentY = Math.max(0, Math.min(100, parseFloat(y)));

  // Calculate target position within the image bounds
  // 0,0 = top-left corner, 50,50 = center, 100,100 = bottom-right corner
  const targetXWithinImage = (percentX / 100) * imageWidth;
  const targetYWithinImage = (percentY / 100) * imageHeight;

  // Convert to absolute position by adding image's position
  const absoluteTargetX = imageLeft + targetXWithinImage;
  const absoluteTargetY = imageTop + targetYWithinImage;

  // Calculate movement needed from button's current position
  // Add 12px offset to compensate for button layout:
  // - Buttons are 170px containers but labels inside have 24px margins (right/bottom)
  // - This creates a visual center offset of ~12px (half of 24px) from the calculated center
  // - The offset ensures buttons visually align with the intended drop position
  const deltaX = absoluteTargetX - currentButtonCenter + 12;
  const deltaY = absoluteTargetY - buttonY + 12;

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

/**
 * Extracts x,y coordinates from pointer, mouse, or touch events
 * @param event - The pointer, mouse, or touch event
 * @returns The x,y coordinates or null if extraction fails
 */
export const extractCoordinates = (event: PointerEvent | MouseEvent | TouchEvent): { x: number; y: number } | null => {
  if ('clientX' in event && 'clientY' in event) {
    return { x: event.clientX, y: event.clientY };
  }
  if ('touches' in event && event.touches?.length > 0) {
    return { x: event.touches[0]!.clientX, y: event.touches[0]!.clientY };
  }
  return null;
};
