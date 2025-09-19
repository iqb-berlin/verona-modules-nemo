export function testContinueButtonFeatures(subject: string, interactionType: string) {
  describe(`Continue Button Features - ${interactionType}`, () => {

    const testSetup = (continueButtonShow: string, file: string) => {
      cy.log(`Testing continueButtonShow: ${continueButtonShow}`);
      cy.setupTestData(subject, file, interactionType);
    };

    const applyStandardScenarios = () => {
      if (interactionType === 'write') {
        // Click any letter
        cy.get('[data-cy=character-button-a]').click();
      } else if (interactionType === 'find_on_image') {
        // Click a specific place on image
        cy.get('[data-cy="image-element"]')
          .click(100, 150);
      } else {
        // InteractionType: BUTTONS, DROP
        cy.get('[data-cy="button-0"]').click();
      }
    };

    const continueButtonConfigs = [
      { continueButtonShow: 'ON_ANY_RESPONSE', file: `${interactionType}_continueButtonShow_onAnyResponse_test.json` },
      { continueButtonShow: 'NO', file: `${interactionType}_continueButtonShow_no_test.json` },
      // eslint-disable-next-line max-len
      { continueButtonShow: 'ON_RESPONSES_COMPLETE', file: `${interactionType}_continueButtonShow_onResponsesComplete_test.json` },
      { continueButtonShow: 'ALWAYS', file: `${interactionType}_continueButtonShow_always_test.json` },
      // eslint-disable-next-line max-len
      { continueButtonShow: 'ON_MAIN_AUDIO_COMPLETE', file: `${interactionType}_continueButtonShow_onMainAudioComplete_test.json` }
    ];

    continueButtonConfigs.forEach(({ continueButtonShow, file }) => {
      if (continueButtonShow === 'ON_ANY_RESPONSE') {
        // eslint-disable-next-line max-len
        it('1 .Should show continue button after any response is clicked when continueButtonShow === ON_ANY_RESPONSE ', () => {
          testSetup(continueButtonShow, file);

          // ontinue button should not exist initially
          cy.assertContinueButtonNotExists();

          applyStandardScenarios();

          // Continue button should appear
          cy.assertContinueButtonExistsAndVisible();
        });
      }
      if (continueButtonShow === 'NO') {
        it('2 .Should not show continue button when continueButtonShow === NO', () => {
          testSetup(continueButtonShow, file);

          // Continue button should not exist initially
          cy.assertContinueButtonNotExists();

          applyStandardScenarios();

          // Continue button should not exist after clicking any button
          cy.assertContinueButtonNotExists();
        });
      }
      if (continueButtonShow === 'ON_RESPONSES_COMPLETE') {
        // eslint-disable-next-line max-len
        it('3 .Should show continue button after all responses are clicked when continueButtonShow === ON_RESPONSES_COMPLETE', () => {
          testSetup(continueButtonShow, file);
          // Continue button should not exist initially
          cy.assertContinueButtonNotExists();

          applyStandardScenarios();

          // Continue button should still not exist
          cy.assertContinueButtonNotExists();

          // Click correct response (variableInfo.codes.parameter value)
          if (interactionType === 'write') {
            const text = ['k', 'o', 'p', 'f'];

            // Delete text that was written previously
            cy.get('[data-cy=backspace-button]').click();
            text.forEach(char => {
              cy.get(`[data-cy=character-button-${char}]`).click();
            });
          } else if (interactionType === 'find_on_image') {
            // Click in position range with given parameter value
            cy.get('[data-cy="image-element"]')
              .then($img => {
                const img = $img[0] as HTMLImageElement;

                // Get actual rendered size + position
                const rect = img.getBoundingClientRect();

                const targetXPercent = 66;
                const targetYPercent = 10;

                // Convert percentage to actual pixel coordinates inside the image box
                const clickX = rect.left + (rect.width * targetXPercent) / 100;
                const clickY = rect.top + (rect.height * targetYPercent) / 100;

                // Click using client coordinates
                cy.wrap($img)
                  .click(clickX - rect.left, clickY - rect.top);
              });
          } else {
            // Click correct button
            cy.get('[data-cy="button-2"]').click();
          }

          // Continue button should appear
          cy.assertContinueButtonExistsAndVisible();
        });
      }
      if (continueButtonShow === 'ALWAYS') {
        it('4 .Should show continue button immediately when continueButtonShow === ALWAYS', () => {
          testSetup(continueButtonShow, file);
          // Default value: ALWAYS Continue button should be visible immediately
          cy.assertContinueButtonExistsAndVisible();
        });
      }
      // Do not test ON_MAIN_AUDIO_COMPLETE for find_on_image as there is no audio for this interaction type
      if (continueButtonShow === 'ON_MAIN_AUDIO_COMPLETE' && interactionType !== 'find_on_image') {
        // eslint-disable-next-line max-len
        it('5 .Should show continue button after main audio is complete when continueButtonShow === ON_MAIN_AUDIO_COMPLETE', () => {
          testSetup(continueButtonShow, file);
          // Continue button should not exist initially
          cy.assertContinueButtonNotExists();

          if (interactionType === 'write') {
            // Click any letter
            cy.get('[data-cy=character-button-a]').click();
          } else {
            // Click any button
            cy.get('[data-cy="button-0"]').click();
          }

          // Continue button should not exist after clicking any button
          cy.assertContinueButtonNotExists();

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
          cy.assertContinueButtonExistsAndVisible();
        });
      }
    });
  });
}
