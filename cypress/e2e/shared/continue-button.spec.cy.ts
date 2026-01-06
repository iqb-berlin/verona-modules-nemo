import { getButtonOptions, getCorrectAnswerParam, getIndexByOneBasedInput } from '../../support/utils';
import {
  InteractionParameters,
  UnitDefinition
} from '../../../projects/player/src/app/models/unit-definition';

export function testContinueButtonFeatures(interactionType: string) {
  describe(`Continue Button Features for interactionType - ${interactionType}`, () => {
    const testSetup = (continueButtonShow: string, file: string) => {
      cy.setupTestData(file, interactionType);
      cy.get('@testData').then(data => {
        const dataToCheck = data as unknown as UnitDefinition;
        if (dataToCheck.firstAudioOptions?.firstClickLayer) {
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
      } else if (interactionType === 'place_value') {
        cy.get('[data-cy="icon-item-ones"]').first().click({ force: true });
      } else {
        // InteractionType: BUTTONS, DROP
        // Click the button index 1
        cy.clickButtonAtIndexOne();
      }
    };

    const applyCorrectAnswerScenarios = (dataToCheck: UnitDefinition) => {
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
      } else if (interactionType === 'place_value') {
        // For place_value, the correctAnswerParam is in the format "tens-ones"
        const targetValue = Number.parseInt(correctAnswerParam, 10);
        const targetTens = Math.floor(targetValue / 10);
        const targetOnes = targetValue % 10;
        cy.movePlaceValueIcons(targetTens, targetOnes);
      } else {
        // For other interaction types (buttons, drop, polygon_buttons),
        // find the button containing the correct answer
        const buttonOptions = getButtonOptions(
          dataToCheck.interactionParameters as unknown as InteractionParameters
        );
        const buttonIndex = getIndexByOneBasedInput(buttonOptions, correctAnswerParam);

        if (buttonIndex !== undefined) {
          const buttonSelector = interactionType === 'polygon_buttons' ?
            `[data-cy="polygon-${buttonIndex}"]` :
            `[data-cy="button-${buttonIndex}"]`;
          cy.get(buttonSelector).click();
        }
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
        it('shows continue button after any response is clicked when continueButtonShow === ON_ANY_RESPONSE ', () => {
          testSetup(continueButtonShow, file);

          // Continue button should not exist initially
          cy.assertContinueButtonNotExists();

          applyStandardScenarios();

          // Continue button should appear
          cy.assertContinueButtonExistsAndVisible();
        });
      }
      if (continueButtonShow === 'NO') {
        it('does not show continue button when continueButtonShow === NO', () => {
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
        it('shows continue button after all responses are clicked when continueButtonShow === ON_RESPONSES_COMPLETE', () => {
          // Setup test data
          testSetup(continueButtonShow, file);

          // Continue button should not exist initially
          cy.assertContinueButtonNotExists();

          // Click wrong answers
          applyStandardScenarios();

          // Continue button should still not exist
          cy.assertContinueButtonNotExists();

          // Get the test data
          cy.get('@testData').then(data => {
            const dataToCheck = data as unknown as UnitDefinition;
            // Click correct answers
            applyCorrectAnswerScenarios(dataToCheck);
          });

          // Continue button should appear
          cy.assertContinueButtonExistsAndVisible();
        });
      }
      if (continueButtonShow === 'ALWAYS') {
        it('shows continue button immediately when continueButtonShow === ALWAYS', () => {
          testSetup(continueButtonShow, file);
          // Default value: ALWAYS Continue button should be visible immediately
          cy.assertContinueButtonExistsAndVisible();
        });
      }
      // Do not test ON_MAIN_AUDIO_COMPLETE for find_on_image as there is no audio for this interaction type
      if (continueButtonShow === 'ON_MAIN_AUDIO_COMPLETE' && interactionType !== 'find_on_image') {
        // eslint-disable-next-line max-len
        it('shows continue button after main audio is complete when continueButtonShow === ON_MAIN_AUDIO_COMPLETE', () => {
          testSetup(continueButtonShow, file);
          // Continue button should not exist initially
          cy.assertContinueButtonNotExists();

          // Click wrong answers
          applyStandardScenarios();

          // Continue button should not exist after clicking any button
          cy.assertContinueButtonNotExists();

          // Click audio button
          cy.get('[data-cy="speaker-icon"]').click();

          // Get the test data
          cy.get('@testData').then(data => {
            const dataToCheck = data as unknown as UnitDefinition;
            // Click correct answers
            applyCorrectAnswerScenarios(dataToCheck);
          });

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
