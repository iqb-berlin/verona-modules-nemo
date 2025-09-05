export function testContinueButtonFeatures(interactionType: string, configFile: string) {
  describe(`Continue Button Features - ${interactionType}`, () => {
    let testData: any;

    beforeEach(() => {
      cy.setupTestData(configFile, interactionType);
      cy.get('@testData').then(data => {
        testData = data;
      });
    });

    it.only('Should handle different values', () => {
      const continueButtonConfigs = [
        { continueButtonShow: 'ALWAYS', file: 'buttons_continueButtonShow_always_test.json' },
        { continueButtonShow: 'NO', file: 'buttons_continueButtonShow_no_test.json' },
        { continueButtonShow: 'ON_ANY_RESPONSE', file: 'buttons_continueButtonShow_onAnyResponse_test.json' },
        // eslint-disable-next-line max-len
        { continueButtonShow: 'ON_RESPONSES_COMPLETE', file: 'buttons_continueButtonShow_onResponsesComplete_test.json' },
        // eslint-disable-next-line max-len
        { continueButtonShow: 'ON_MAIN_AUDIO_COMPLETE', file: 'buttons_continueButtonShow_onMainAudioComplete_test.json' },
        { continueButtonShow: 'ON_VIDEO_COMPLETE', file: 'buttons_continueButtonShow_onVideoComplete_test.json' }
      ];

      continueButtonConfigs.forEach(({ continueButtonShow, file }) => {
        cy.log(`Testing continueButtonShow: ${continueButtonShow}`);
        cy.setupTestData(file, 'buttons');
        cy.get('@testData').then(data => {
          testData = data;
        });

        if (continueButtonShow === 'ON_ANY_RESPONSE') {
          // Initially no continue button
          cy.get('[data-testid="continue-button"]').should('not.exist');

          // Click any button
          cy.get('[data-testid="button-0"]').click();

          // Continue button should appear
          cy.get('[data-testid="continue-button"]').should('exist').and('be.visible');

          cy.log(`Continue button appears after response for rule: ${continueButtonShow}`);
        } else if (continueButtonShow === 'NO') {
          // Continue button should not exist initially
          cy.get('[data-testid="continue-button"]').should('not.exist');

          // Click any button
          cy.get('[data-testid="button-0"]').click();

          // Continue button should not exist after clicking any button
          cy.get('[data-testid="continue-button"]').should('not.exist');

          cy.log(`Continue button does not exist for rule: ${continueButtonShow}`);
        } else if (continueButtonShow === 'ON_RESPONSES_COMPLETE') {
          // Continue button should not exist initially
          cy.get('[data-testid="continue-button"]').should('not.exist');

          // Click any button
          cy.get('[data-testid="button-0"]').click();

          // Continue button should not exist after clicking any button
          cy.get('[data-testid="continue-button"]').should('not.exist');

          // Click correct response (variableInfo.codes.parameter value)
          cy.get('[data-testid="button-2"]').click();

          // Continue button should appear
          cy.get('[data-testid="continue-button"]').should('exist').and('be.visible');

          cy.log(`Continue button appears only after clicking the correct answer for rule: ${continueButtonShow}`);
        } else if (continueButtonShow === 'ON_MAIN_AUDIO_COMPLETE') {
          // Continue button should not exist initially
          cy.get('[data-testid="continue-button"]').should('not.exist');

          // Click any button
          cy.get('[data-testid="button-0"]').click();

          // Continue button should not exist after clicking any button
          cy.get('[data-testid="continue-button"]').should('not.exist');

          // Click audio button
          cy.get('[data-testid="speaker-icon"]').click();
          // Immediately click any button
          cy.get('[data-testid="button-0"]').click();

          // Continue button still should not exist
          cy.get('[data-testid="continue-button"]').should('not.exist');

          // Wait for audio to complete
          cy.wait(3000);

          // Continue button should appear
          cy.get('[data-testid="continue-button"]').should('exist').and('be.visible');

          cy.log(`Continue button appears only after clicking the correct answer for rule: ${continueButtonShow}`);
        } else if (continueButtonShow === 'ON_VIDEO_COMPLETE') {
          // Continue button should not exist initially
          cy.get('[data-testid="continue-button"]').should('not.exist');

          // Click video button
          cy.get('[data-testid="video-play-button"]').click();

          // Continue button should not exist after clicking the video button
          cy.get('[data-testid="continue-button"]').should('not.exist');

          // Wait for the video to complete
          cy.wait(50000);

          // Continue button should appear
          cy.get('[data-testid="continue-button"]').should('exist').and('be.visible');

          cy.log(`Continue button appears only after clicking the correct answer for rule: ${continueButtonShow}`);
        } else {
          // Default value: ALWAYS Continue button should be visible immediately
          cy.get('[data-testid="continue-button"]').should('exist').and('be.visible');

          cy.log(`Continue button always visible for rule: ${continueButtonShow}`);
        }
      });
    });
  });
}
