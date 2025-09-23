import {
  InteractionButtonParams,
  InteractionDropParams,
  UnitDefinition
} from '../../../../projects/player/src/app/models/unit-definition';
import { getButtonOptions, getCorrectAnswerParam, getIndexByOneBasedInput } from '../../../support/utils';

export function testAudioFeedback(subject: string, interactionType: string) {
  describe(`Audio Feedback - ${interactionType}`, () => {
    const loadDefaultTestFile = () => {
      cy.setupTestData(subject, `${interactionType}_feedback_test`, interactionType);
      return cy.get('@testData') as unknown as Cypress.Chainable<UnitDefinition>;
    };

    /**
     * Function to handle the interaction with the correct answer.
     */
    const performInteraction = (
      testData: UnitDefinition,
      correctAnswerParam: string
    ) => {
      // Handle WRITE interactionType
      if (interactionType === 'write') {
        // Delete text that was written previously
        cy.clearTextInput(testData);
        // Write the correct answer on the keyboard
        cy.writeTextOnKeyboard(correctAnswerParam);
      }

      // Handle BUTTONS and DROP interactionType
      if (interactionType === 'buttons' || interactionType === 'drop') {
        const buttonOptions = getButtonOptions(
          testData.interactionParameters as InteractionButtonParams | InteractionDropParams
        );
        const buttonIndex = getIndexByOneBasedInput(buttonOptions, correctAnswerParam);

        cy.get(`[data-cy="button-${buttonIndex}"]`).click();
      }

      // Handle FIND_ON_IMAGE interactionType
      if (interactionType === 'find_on_image') {
        // For find on image, the correctAnswerParam is in the format "x1,y1-x2,y2"
        cy.clickInPositionRange(correctAnswerParam);
      }
    };

    it('1. Should play the right feedback according to the selected answer', () => {
      // Load the file
      loadDefaultTestFile().then(testData => {
        // Get the correct answer parameter
        const correctAnswerParam = getCorrectAnswerParam(testData);

        const audioFeedback = testData.audioFeedback;
        const correctFeedback = audioFeedback?.feedback.find(obj => obj.parameter === '1');
        const correctFeedbackSrc = correctFeedback?.audioSource;
        const wrongFeedback = audioFeedback?.feedback.find(feedback => feedback.parameter === '0');
        const wrongFeedbackSrc = wrongFeedback?.audioSource;

        if (['buttons', 'drop', 'write'].includes(interactionType)) {
          // Only try to remove the click layer for interaction types that have one
          cy.removeClickLayer();

          // Wait until the audio is played until the end for interaction types that have one
          cy.waitUntilAudioIsFinishedPlaying();
        }

        // First interaction - should be the wrong answer
        if (interactionType === 'buttons' || interactionType === 'drop') {
          // Click the button index 1
          cy.clickButtonAtIndexOne();
        } else if (interactionType === 'write') {
          const text = 'kopf';
          cy.writeTextOnKeyboard(text);
        } else if (interactionType === 'find_on_image') {
          // Click on a wrong position - outside the correct position range
          cy.get('[data-cy="image-element"]').click(10, 10);
        }

        // Click on the continue button
        cy.clickContinueButton();

        // Wait until the feedback is played until the end
        cy.waitUntilFeedbackIsFinishedPlaying();

        // check if the audio source is equal to the wrong answer
        cy.get('[data-cy="continue-button-audio"]').should('have.attr', 'src', wrongFeedbackSrc);

        // Perform the interaction with correct answer
        performInteraction(testData, correctAnswerParam);

        // cy.get(`[data-cy="button-${buttonIndex}"]`).click();

        // Click on the continue button again
        cy.clickContinueButton();

        // Wait until the feedback is played until the end
        cy.waitUntilFeedbackIsFinishedPlaying();

        // Now the audio source has to be the correct answer
        cy.get('[data-cy="continue-button-audio"]').should('have.attr', 'src', correctFeedbackSrc);
      });
    });
  });
}
