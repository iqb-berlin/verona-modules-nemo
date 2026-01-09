import { UnitDefinition } from '../../../projects/player/src/app/models/unit-definition';

export function testOpeningImageFeatures(interactionType: string, configFile: string) {
  describe(`Opening Image Features for interactionType - ${interactionType}`, () => {
    let testData: UnitDefinition;

    beforeEach(() => {
      cy.setupTestData(configFile, interactionType);
      cy.get('@testData').then(data => {
        testData = data as unknown as UnitDefinition;
      });
    });

    it('should show and hide opening image correctly', () => {
      // Remove click layer to enable interactions
      cy.removeClickLayer();

      // In the beginning, data-cy="opening-image" cannot be seen
      cy.get('[data-cy="opening-image"]').should('not.exist');

      // But the data-cy="speaker-icon" can be seen.
      cy.get('[data-cy="speaker-icon"]').should('be.visible');

      // After the audio is played
      cy.get('[data-cy="speaker-icon"]').click();
      cy.waitUntilAudioIsFinishedPlaying();

      // data-cy="opening-image" can be seen
      cy.get('[data-cy="opening-image"]').should('be.visible');

      // and stays presentationDurationMS milliseconds
      cy.get('@testData').then((data: any) => {
        const duration = data.openingImage?.presentationDurationMS || 0;
        cy.wait(duration);
      });

      // then it can not be seen anymore
      cy.get('[data-cy="opening-image"]').should('not.exist');

      // after the opening-image is gone, it automatically plays the audioSource inside the mainAudio
      cy.get('[data-cy="audio-button-animation"]').should('have.class', 'playing');
    });

    /** TO-DO: Add test to check if speaker-icon and continue-button is hidden as long as imageSource is shown */
    /** TO-DO: Add test to check if imageUseFullArea being applied correctly */
  });
}
