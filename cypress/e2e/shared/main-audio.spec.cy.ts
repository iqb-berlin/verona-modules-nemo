import { UnitDefinition } from '../../../projects/player/src/app/models/unit-definition';

export function testMainAudioFeatures(interactionType: string, configFile: string) {
  describe(`Main Audio Features for interactionType - ${interactionType}`, () => {
    let testData: UnitDefinition;

    beforeEach(() => {
      cy.setupTestData(configFile, interactionType);
      cy.get('@testData').then(data => {
        testData = data as unknown as UnitDefinition;
      });
    });

    it('has audio button', () => {
      // Check if the speaker icon exists
      cy.get('[data-cy="speaker-icon"]').should('exist');
    });

    it('handles firstClickLayer correctly', () => {
      if (testData.firstAudioOptions?.firstClickLayer) {
        cy.get('[data-cy="click-layer"]').should('exist').and('be.visible');

        // Remove click layer to enable interactions
        cy.removeClickLayer();

        // After clicking, the layer should disappear
        cy.get('[data-cy="click-layer"]').should('not.exist');
        // Now interactions should be possible (unless disableInteractionUntilComplete is also true)
        if (!testData.mainAudio?.disableInteractionUntilComplete) {
          // if interactionType:IMAGE_ONLY, then it is enough that the image exists and visible
          if (interactionType === 'image_only') {
            cy.get('[data-cy="stimulus-image"]').should('exist').and('be.visible');
          } else if (interactionType === 'write') {
            cy.get('[data-cy=character-button-a]').click();
            cy.get('[data-cy=text-span]').should('contain', 'a');
          } else if (interactionType === 'place_value') {
            cy.get('[data-cy=icon-item-tens]').first().click({ force: true });
            cy.get('[data-cy=icon-item-tens-moved]').should('exist');
          } else {
            const buttonSelector = interactionType === 'polygon_buttons' ?
              '[data-cy="polygon-0"]' :
              '[data-cy="button-0"]';
            const selectedClass = interactionType === 'polygon_buttons' ? 'clicked' : 'selected';
            cy.get(buttonSelector).should('be.visible').click();
            cy.get(buttonSelector).should('have.class', selectedClass);
          }
        }
      }
    });

    it('waits for audio completion when disableInteractionUntilComplete is true', () => {
      if (testData.mainAudio?.disableInteractionUntilComplete) {
        // Initially, the interaction should be disabled with overlay visible
        cy.get('[data-cy="interaction-disabled-overlay"]').should('exist');

        // Remove click layer to enable interactions
        cy.removeClickLayer();

        // Click the audio button to start playing
        cy.get('[data-cy="speaker-icon"]').click();

        // Wait for audio to finish playing
        cy.waitUntilAudioIsFinishedPlaying();

        // After audio completion, the overlay should disappear
        cy.get('[data-cy="interaction-disabled-overlay"]').should('not.exist');

        if (interactionType === 'image_only') {
          cy.get('[data-cy="stimulus-image"]').should('exist').and('be.visible');
        } else if (interactionType === 'write') {
          // Keyboard should be clickable
          cy.get('[data-cy=character-button-a]').should('not.be.disabled');
        } else {
          // Buttons should be clickable
          const buttonSelector = interactionType === 'polygon_buttons' ?
            '[data-cy="polygon-0"]' :
            '[data-cy="button-0"]';
          cy.get(buttonSelector).click();
          if (interactionType === 'polygon_buttons') {
            cy.get(buttonSelector).should('have.class', 'clicked');
          } else {
            cy.get(`${buttonSelector} input`).should('have.attr', 'data-selected');
          }
        }
      }
    });

    it('is consistent with maxPlay time', () => {
      const maxPlayTime = testData.mainAudio?.maxPlay ?? 1;

      // Remove click layer
      cy.removeClickLayer();

      // Initially audio button container should be enabled
      cy.get('[data-cy="audio-button-container"]').should('exist');
      if (maxPlayTime > 0) {
        // Click the audio button exactly maxPlayTime times
        for (let i = 0; i < maxPlayTime; i++) {
          cy.get('[data-cy="speaker-icon"]').click();
          // Wait for audio to finish playing
          cy.waitUntilAudioIsFinishedPlaying();
        }

        // One extra click beyond maxPlay should NOT start playback again
        cy.get('[data-cy="speaker-icon"]').click();

        // Assert that the audio does not start playing again
        // Check immediately and after a short delay to ensure it doesn't flip to playing
        cy.get('[data-cy="audio-button-animation"]').should('not.have.class', 'playing');
        cy.wait(1000);
        cy.get('[data-cy="audio-button-animation"]').should('not.have.class', 'playing');
      }
    });

    it('is limitless clickable when maxPlay is 0', () => {
      // Set up test data
      cy.setupTestData(`${interactionType}_maxPlay_0_test.json`, `${interactionType}`);

      // A number to test it is more times clickable
      const clickTime = 5;

      // Initially audio button container should be enabled
      cy.get('[data-cy="audio-button-container"]').should('exist');

      // Click the audio button maxPLayTime times
      for (let i = 0; i < clickTime; i++) {
        cy.get('[data-cy="speaker-icon"]').click();
        // Wait for audio to finish playing
        cy.waitUntilAudioIsFinishedPlaying();
      }
      // After many times clicked, the container should still exist
      cy.get('[data-cy="audio-button-container"]').should('exist');
    });

    it('animates audio button when animateButton is true', () => {
      // Set up test data
      cy.setupTestData(`${interactionType}_animateButton_true_test.json`, interactionType);

      cy.get('@testData').then(data => {
        testData = data as unknown as UnitDefinition;

        if (testData.firstAudioOptions?.animateButton) {
          // The button should NOT be moving initially
          cy.get('.custom-audio-button').should('exist').and('not.have.class', 'moving-button');

          // Do not interact with the page; wait slightly over 10 seconds
          cy.wait(11000);

          // After 10s of inactivity (and before first interaction), it should start moving
          cy.get('.custom-audio-button').should('have.class', 'moving-button');
        }
      });
    });
  });
}
