import {
  InteractionButtonParams,
  InteractionDropParams,
  SelectionOption,
  UnitDefinition
} from '../../../../projects/player/src/app/models/unit-definition';
import { VariableInfo } from '../../../../projects/player/src/app/models/responses';
import { getIndexByOneBasedInput } from '../../../support/utils';

export function testAudioFeedback(subject: string, interactionType: string) {
  describe(`Audio Feedback - ${interactionType}`, () => {
    const loadDefaultTestFile = () => {
      cy.setupTestData(subject, `${interactionType}_feedback_test`, interactionType);
      return cy.get('@testData') as unknown as Cypress.Chainable<UnitDefinition>;
    };

    /**
     * Returns InteractionOptions or SelectionOption[] for BUTTONS interactionType.
     */
    const getButtonOptions =
      (interactionParameters: InteractionButtonParams | InteractionDropParams): SelectionOption[] => {
        const opts = interactionParameters.options;

        // If options is already an array (drop interaction)
        if (Array.isArray(opts)) {
          return opts;
        }

        // If options is an object with buttons property (button interaction)
        if (opts && 'buttons' in opts && Array.isArray(opts.buttons)) {
          return opts.buttons;
        }

        return [];
      };

    it('1. Should play the right feedback according to the selected answer', () => {
      // Load the file
      loadDefaultTestFile().then(testData => {
        const variableInfo = testData.variableInfo as VariableInfo[];
        const correctAnswerIndex = variableInfo[0]?.codes[0]?.parameter || '';

        const audioFeedback = testData.audioFeedback;
        const correctFeedback = audioFeedback?.feedback.find(obj => obj.parameter === '1');
        const correctFeedbackSrc = correctFeedback?.audioSource;
        const wrongFeedback = audioFeedback?.feedback.find(feedback => feedback.parameter === '0');
        const wrongFeedbackSrc = wrongFeedback?.audioSource;

        // Remove click layer
        cy.removeClickLayer();

        // Wait until the audio is played until the end
        cy.waitUntilAudioIsFinishedPlaying();

        // Click the button index 1
        cy.clickButtonAtIndexOne();

        // Click on the continue button
        cy.clickContinueButton();

        // Wait until the audio is played until the end
        cy.waitUntilAudioIsFinishedPlaying();

        // check if the audio source is equal to the wrong answer
        cy.get('[data-cy="continue-button-audio"]').should('have.attr', 'src', wrongFeedbackSrc);
        cy.log('WRONG answer audio source is found');

        // Then click on the correct button
        // eslint-disable-next-line max-len
        const buttonOptions = getButtonOptions(testData.interactionParameters as InteractionButtonParams | InteractionDropParams);
        const buttonIndex = getIndexByOneBasedInput(buttonOptions, correctAnswerIndex);

        cy.get(`[data-cy="button-${buttonIndex}"]`).click();

        // Click on the continue button again
        cy.clickContinueButton();

        // Now the audio source has to be the correct answer
        cy.get('[data-cy="continue-button-audio"]').should('have.attr', 'src', correctFeedbackSrc);
        cy.log('CORRECT answer audio source is found');
      });
    });
  });
}
