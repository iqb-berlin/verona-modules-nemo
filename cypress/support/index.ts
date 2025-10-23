import { VopStartCommand } from '../../projects/player/src/app/models/verona';
import { UnitDefinition } from '../../projects/player/src/app/models/unit-definition';

export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {

      /**
       * Load unit definition example file for component testing
       * @param fileName - Test data file name
       */
      loadUnit(fileName: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Setup test data for component testing
       * @param subject - Test subject (eg: deutsch, mathe...)
       * @param configFile - Test data file name (eg: buttons_test...)
       * @param interactionType - interactionType parameter of component being tested (eg: buttons, drop...)
       */
      setupTestData(subject:string, configFile: string, interactionType: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Click on the click layer
       * */
      removeClickLayer(): Chainable<void>;

      /**
       * Setup test data for postMessages testing
       * @param subject - Test subject (eg: deutsch, mathe...)
       * @param configFile - Test data file name (eg: buttons_test...)
       * @param interactionType - interactionType parameter of component being tested (eg: buttons, drop...)
       */
      // eslint-disable-next-line max-len
      setupTestDataWithPostMessageMock(subject:string, configFile: string, interactionType: string): Chainable<JQuery<HTMLElement>>

      /**
       * Send message from parent window
       * @param data - Message data
       * @param origin - Message origin
       */
      sendMessageFromParent(data: VopStartCommand, origin?: string): Chainable<void>;

      /**
       * Assert that the continue button exists and visible
       * */
      assertContinueButtonExistsAndVisible(): Chainable<void>;

      /**
       * Assert that the continue button does NOT exists
       * */
      assertContinueButtonNotExists(): Chainable<void>;

      /**
       * Click on the continue button
       * */
      clickContinueButton(): Chainable<void>;

      /**
       * Clicks the button at index 1
       * */
      clickButtonAtIndexOne(): Chainable<void>;

      /**
       * Assert that the audio is played until the end
       * */
      waitUntilAudioIsFinishedPlaying(): Chainable<void>;

      /**
       * Writes text on keyboard
       * @param text - Array of the letters to write on keyboard
       * */
      writeTextOnKeyboard(text: string): Chainable<void>;

      /**
       * Assert that the feedback is played until the end
       * */
      waitUntilFeedbackIsFinishedPlaying(): Chainable<void>;

      /**
       * Clicks within a position range on an image element
       * @param positionRange - Position range in format "x1,y1-x2,y2", e.g. "42,35-55,87"
       */
      clickInPositionRange(positionRange: string): Chainable<void>;

      /**
       * Custom command to clear text input by clicking backspace until text span is empty
       * Uses maxInputLength from testData if available, otherwise uses default value
       * @param testData Optional test data containing interactionParameters.maxInputLength
       */
      clearTextInput(testData?: UnitDefinition): Chainable<void>

    }
  }
}
