import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    fixturesFolder: 'projects/player/test/'
    // supportFile: 'e2e/support/e2e.ts',
    // specPattern: 'e2e/*.spec.cy.ts'
  }
});
