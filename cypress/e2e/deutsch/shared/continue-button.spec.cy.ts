export function testContinueButtonFeatures(subject: string, interactionType: string, configFile: string) {
  describe(`Continue Button Features - ${interactionType}`, () => {

    it('1 .Should comply with continueButtonShow value to show/hide continue button', () => {
      const continueButtonConfigs = [
        { continueButtonShow: 'ALWAYS', file: `${interactionType}_continueButtonShow_always_test.json` },
        { continueButtonShow: 'NO', file: `${interactionType}_continueButtonShow_no_test.json` },
        // eslint-disable-next-line max-len
        { continueButtonShow: 'ON_ANY_RESPONSE', file: `${interactionType}_continueButtonShow_onAnyResponse_test.json` },
        // eslint-disable-next-line max-len
        { continueButtonShow: 'ON_RESPONSES_COMPLETE', file: `${interactionType}_continueButtonShow_onResponsesComplete_test.json` },
        // eslint-disable-next-line max-len
        { continueButtonShow: 'ON_MAIN_AUDIO_COMPLETE', file: `${interactionType}_continueButtonShow_onMainAudioComplete_test.json` }
      ];

      continueButtonConfigs.forEach(({ continueButtonShow, file }) => {
        cy.log(`Testing continueButtonShow: ${continueButtonShow}`);
        cy.setupTestData(subject, file, interactionType);

        if (continueButtonShow === 'ON_ANY_RESPONSE') {
          // Initially no continue button
          cy.get('[data-cy="continue-button"]').should('not.exist');

          if (interactionType === 'write') {
            // Click any letter
            cy.get('[data-cy=character-button-a]').click();
          } else {
            // Click any button
            cy.get('[data-cy="button-0"]').click();
          }

          // Continue button should appear
          cy.get('[data-cy="continue-button"]').should('exist').and('be.visible');

          cy.log(`Continue button appears after response for rule: ${continueButtonShow}`);
        } else if (continueButtonShow === 'NO') {
          // Continue button should not exist initially
          cy.get('[data-cy="continue-button"]').should('not.exist');

          if (interactionType === 'write') {
            // Click any letter
            cy.get('[data-cy=character-button-a]').click();
          } else {
            // Click any button
            cy.get('[data-cy="button-0"]').click();
          }

          // Continue button should not exist after clicking any button
          cy.get('[data-cy="continue-button"]').should('not.exist');

          cy.log(`Continue button does not exist for rule: ${continueButtonShow}`);
        } else if (continueButtonShow === 'ON_RESPONSES_COMPLETE') {
          // Continue button should not exist initially
          cy.get('[data-cy="continue-button"]').should('not.exist');

          if (interactionType === 'write') {
            // Click any letter
            cy.get('[data-cy=character-button-a]').click();
          } else {
            // Click any button
            cy.get('[data-cy="button-0"]').click();
          }

          // Continue button should not exist after clicking any button
          cy.get('[data-cy="continue-button"]').should('not.exist');

          // Click correct response (variableInfo.codes.parameter value)
          if (interactionType === 'write') {
            const text = ['k', 'o', 'p', 'f'];

            // Delete text that was written previously
            cy.get('[data-cy=backspace-button]').click();
            text.forEach(char => {
              cy.get(`[data-cy=character-button-${char}]`).click();
            });
          } else {
            // Click correct button
            cy.get('[data-cy="button-2"]').click();
          }

          // Continue button should appear
          cy.get('[data-cy="continue-button"]').should('exist').and('be.visible');

          cy.log(`Continue button appears only after clicking the correct answer for rule: ${continueButtonShow}`);
        } else if (continueButtonShow === 'ON_MAIN_AUDIO_COMPLETE') {
          // Continue button should not exist initially
          cy.get('[data-cy="continue-button"]').should('not.exist');

          if (interactionType === 'write') {
            // Click any letter
            cy.get('[data-cy=character-button-a]').click();
          } else {
            // Click any button
            cy.get('[data-cy="button-0"]').click();
          }

          // Continue button should not exist after clicking any button
          cy.get('[data-cy="continue-button"]').should('not.exist');

          // Click audio button
          cy.get('[data-cy="speaker-icon"]').click();
          // Immediately click
          if (interactionType === 'write') {
            // any letter
            cy.get('[data-cy=character-button-a]').click();
          } else {
            // any button
            cy.get('[data-cy="button-0"]').click();
          }

          // Continue button still should not exist
          cy.get('[data-cy="continue-button"]').should('not.exist');

          // Wait for audio to complete
          cy.wait(3000);

          // Continue button should appear
          cy.get('[data-cy="continue-button"]').should('exist').and('be.visible');

          cy.log(`Continue button appears only after the main audio is complete for rule: ${continueButtonShow}`);
        } else {
          // Default value: ALWAYS Continue button should be visible immediately
          cy.get('[data-cy="continue-button"]').should('exist').and('be.visible');

          cy.log(`Continue button always visible for rule: ${continueButtonShow}`);
        }
      });
    });

    // BELOW TEST WILL BE USED ONLY FOR interactionType: VIDEO
    // it('Should handle ON_VIDEO_COMPLETE value', () => {
    //   if (continueButtonShow === 'ON_VIDEO_COMPLETE') {
    //     // Continue button should not exist initially
    //     cy.get('[data-cy="continue-button"]').should('not.exist');
    //
    //     // Click video button
    //     cy.get('[data-cy="video-play-button"]').click();
    //
    //     // Continue button should not exist after clicking the video button
    //     cy.get('[data-cy="continue-button"]').should('not.exist');
    //
    //     // Wait for the video to complete
    //     cy.wait(50000);
    //
    //     // Continue button should appear
    //     cy.get('[data-cy="continue-button"]').should('exist').and('be.visible');
    //
    //     cy.log(`Continue button appears only after video is complete for rule: ${continueButtonShow}`);
    //   }
    // });
  });
}
