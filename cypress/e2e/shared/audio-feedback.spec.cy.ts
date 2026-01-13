import {
  UnitDefinition
} from '../../../projects/player/src/app/models/unit-definition';

export function testAudioFeedback(interactionType: string, configFile: string) {
  describe(`Audio Feedback Features for interactionType - ${interactionType}`, () => {
    const loadDefaultTestFile = () => {
      cy.setupTestData(configFile, interactionType);
      return cy.get('@testData') as unknown as Cypress.Chainable<UnitDefinition>;
    };

    it('plays the right feedback according to the selected answer', () => {
      // Load the file
      loadDefaultTestFile().then(testData => {
        // Remove click layer if it's not a FIND_ON_IMAGE interaction type, because it doesn't have a speaker icon
        if (interactionType !== 'find_on_image') {
          // Start the audio
          cy.get('[data-cy="speaker-icon"]').click();

          // Wait until the audio is finished playing
          cy.waitUntilAudioIsFinishedPlaying();
        }

        // First interaction - should be the wrong answer
        cy.applyStandardScenarios(interactionType);

        // Click on the continue button
        cy.clickContinueButton();

        // Wait until the feedback is played until the end
        cy.waitUntilFeedbackIsFinishedPlaying();

        // Perform the interaction with correct answer
        cy.applyCorrectAnswerScenarios(interactionType, testData);

        // Click on the continue button again
        cy.clickContinueButton();

        // Wait until the feedback is played until the end
        cy.waitUntilFeedbackIsFinishedPlaying();
      });
    });
  });
}
