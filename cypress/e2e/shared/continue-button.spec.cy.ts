import { getButtonOptions, getCorrectAnswerParam, getIndexByOneBasedInput } from '../../support/utils';
import {
  UnitDefinition
} from '../../../projects/player/src/app/models/unit-definition';

export function testContinueButtonFeatures(interactionType: string) {
  describe(`Continue Button Features - ${interactionType}`, () => {
    const testSetup = (continueButtonShow: string, file: string) => {
      cy.log(`Testing continueButtonShow: ${continueButtonShow}`);
      cy.log(`Testing file: ${file}`);
      cy.log(`Testing interactionType: ${interactionType}`);
      cy.setupTestData(file, interactionType);
      cy.get('@testData').then((data: any) => {
        if (data.firstAudioOptions?.firstClickLayer) {
          cy.removeClickLayer();
        }
      });
    };

    const applyStandardScenarios = () => {
      cy.log('first apply standard scenarios that are wrong:');
      if (interactionType === 'write') {
        // Click any letter
        cy.get('[data-cy=character-button-a]').click();
      } else if (interactionType === 'find_on_image') {
        // Click a specific place on image
        cy.get('[data-cy="image-element"]')
          .click(100, 150);
      } else if (interactionType === 'polygon_buttons') {
        cy.get('[data-cy="polygon-1"]').click();
      } else {
        // InteractionType: BUTTONS, DROP
        // Click the button index 1
        cy.clickButtonAtIndexOne();
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

          // Continue button should not exist initially
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
          // Setup test data
          testSetup(continueButtonShow, file);

          // Continue button should not exist initially
          cy.assertContinueButtonNotExists();

          // Click wrong answers
          applyStandardScenarios();

          // Continue button should still not exist
          cy.assertContinueButtonNotExists();

          // Get the test data and extract correct answer parameter
          cy.get('@testData').then(data => {
            const dataToCheck = data as unknown as UnitDefinition;

            const correctAnswerParam = getCorrectAnswerParam(dataToCheck);

            // Click correct answer based on interaction type
            if (interactionType === 'write') {
              // Delete text that was written previously
              cy.clearTextInput(dataToCheck);
              // Write the correct answer on the keyboard
              cy.writeTextOnKeyboard(correctAnswerParam);
            } else if (interactionType === 'find_on_image') {
              // For find_on_image, the correctAnswerParam is in the format "x1,y1-x2,y2"
              cy.clickInPositionRange(correctAnswerParam);
            } else {
              // For other interaction types (buttons, drop, polygon_buttons),
              // find the button containing the correct answer
              const buttonOptions = getButtonOptions(
                dataToCheck.interactionParameters as any
              );
              const buttonIndex = getIndexByOneBasedInput(buttonOptions, correctAnswerParam);

              if (buttonIndex !== undefined) {
                const buttonSelector = interactionType === 'polygon_buttons' ?
                  `[data-cy="polygon-${buttonIndex}"]` :
                  `[data-cy="button-${buttonIndex}"]`;
                cy.get(buttonSelector).click();
              }
            }

            // Continue button should appear
            cy.assertContinueButtonExistsAndVisible();
          });
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
            const buttonSelector = interactionType === 'polygon_buttons' ?
              '[data-cy="polygon-0"]' :
              '[data-cy="button-0"]';
            cy.get(buttonSelector).click();
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
            const buttonSelector = interactionType === 'polygon_buttons' ?
              '[data-cy="polygon-0"]' :
              '[data-cy="button-0"]';
            cy.get(buttonSelector).click();
          }

          // Continue button still should not exist
          cy.assertContinueButtonNotExists();

          // Wait for audio to complete
          cy.waitUntilAudioIsFinishedPlaying();

          // Continue button should appear
          cy.assertContinueButtonExistsAndVisible();
        });
      }
    });
  });
}
