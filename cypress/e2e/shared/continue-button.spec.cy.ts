export function testContinueButtonFeatures(interactionType: string, configFile: string) {
  describe(`Continue Button Features - ${interactionType}`, () => {
    let testData: any;

    beforeEach(() => {
      cy.setupTestData(configFile, interactionType);
      cy.get('@testData').then(data => {
        testData = data;
      });
    });

    it('Should handle different values', () => {
      const continueButtonRules = ['ALWAYS', 'NO', 'ON_ANY_RESPONSE', 'ON_AUDIO_AND_RESPONSE', 'ON_RESPONSES_COMPLETE', 'ON_MAIN_AUDIO_COMPLETE', 'ON_VIDEO_COMPLETE'];

      continueButtonRules.forEach((rule) => {
        cy.then(() => {
          // Create modified test data with the current continue button rule
          const modifiedTestData = { ...testData };
          modifiedTestData.continueButtonShow = rule;

          const tempFileName = `temp_continue_${rule.toLowerCase()}_test.json`;

          // Write temporary fixture
          cy.writeFile(`cypress/fixtures/${tempFileName}`, modifiedTestData);

          // Visit and load
          cy.visit('http://localhost:4200');
          cy.loadUnit(tempFileName);

          // Remove click layer if needed
          if (testData.mainAudio?.firstClickLayer) {
            cy.get('[data-testid="click-layer"]').click();
          }

          // Wait for buttons to be rendered
          cy.get('[data-testid="button-0"]').should('exist');

          if (rule === 'ON_ANY_RESPONSE') {
            // Initially no continue button
            cy.get('[data-testid="continue-button"]').should('not.exist');

            // Click any button
            cy.get('[data-testid="button-0"]').click();

            // Continue button should appear
            cy.get('[data-testid="continue-button"]').should('exist').and('be.visible');

            cy.log(`✓ Continue button appears after response for rule: ${rule}`);
          } else if (rule === 'ALWAYS') {
            // Continue button should be visible immediately
            cy.get('[data-testid="continue-button"]').should('exist').and('be.visible');

            cy.log(`✓ Continue button always visible for rule: ${rule}`);
          }

          // Clean up temporary file
          cy.task('deleteFile', `cypress/fixtures/${tempFileName}`);
        });
      });
    });
  });
}
