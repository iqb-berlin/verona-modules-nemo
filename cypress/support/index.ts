import { VopStartCommand } from '../../projects/player/src/app/models/verona';

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
       * Assert that the click layer is removed from the DOM
       * */
      assertRemoveClickLayer(): Chainable<void>;

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
       * Assert that the continue button click event is triggered
       * */
      assertContinueButtonClick(): Chainable<void>;
    }
  }
}
