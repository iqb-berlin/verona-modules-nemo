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
       * @param configFile - Test data file name
       * @param interactionType - interactionType parameter of component being tested
       */
      setupTestData(configFile: string, interactionType: string): Chainable<JQuery<HTMLElement>>
    }
  }
}
