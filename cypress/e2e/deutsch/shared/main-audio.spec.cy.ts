import { UnitDefinition } from '../../../../projects/player/src/app/models/unit-definition';

export function testMainAudioFeatures(subject: string, interactionType: string, configFile: string) {
  describe(`Main Audio Features - ${interactionType}`, () => {
    let testData: UnitDefinition;

    beforeEach(() => {
      cy.setupTestData(subject, configFile, interactionType);
      cy.get('@testData').then(data => {
        testData = data as unknown as UnitDefinition;
      });
    });

    it('1. Should have audio button', () => {
      // Check if the speaker icon exists
      cy.get('[data-cy="speaker-icon"]').should('exist');
    });

    it('2. Should handle firstClickLayer correctly', () => {
      if (testData.mainAudio?.firstClickLayer) {
        cy.get('[data-cy="click-layer"]').should('exist').and('be.visible');

        // Click anywhere on the screen to enable interactions
        cy.assertRemoveClickLayer();

        // After clicking, the layer should disappear
        cy.get('[data-cy="click-layer"]').should('not.exist');
        // Now interactions should be possible (unless disableInteractionUntilComplete is also true)
        if (!testData.mainAudio?.disableInteractionUntilComplete) {
          // if interactionType:IMAGE_ONLY, then it is enough that the image exists and visible
          if (interactionType === 'image_only') {
            cy.get('[data-cy="image-only-container"]').should('exist').and('be.visible');
          } else if (interactionType === 'write') {
            cy.get('[data-cy=character-button-a]').click();
            cy.get('[data-cy=text-span]').should('contain', 'a');
          } else {
            cy.get('[data-cy="button-0"]').should('be.visible').click();
            cy.get('[data-cy="button-0"]').should('have.class', 'selected');
          }
        }
      }
    });

    it('3. Should wait for audio completion when disableInteractionUntilComplete is true', () => {
      if (testData.mainAudio?.disableInteractionUntilComplete) {
        // Initially, the interaction should be disabled with overlay visible
        cy.get('[data-cy="interaction-disabled-overlay"]').should('exist');

        // Click anywhere on the screen to enable interactions
        cy.assertRemoveClickLayer();

        // Click the audio button to start playing
        cy.get('[data-cy="speaker-icon"]').click();

        // Wait for audio to complete
        cy.wait(3000);

        // After audio completion, the overlay should disappear
        cy.get('[data-cy="interaction-disabled-overlay"]').should('not.exist');

        if (interactionType === 'image_only') {
          cy.get('[data-cy="image-only-container"]').should('exist').and('be.visible');
        } else if (interactionType === 'write') {
          // Keyboard should be clickable
          cy.get('[data-cy=character-button-a]').should('not.be.disabled');
        } else {
          // Buttons should be clickable
          cy.get('[data-cy="button-0"]').click();
          cy.get('[data-cy="button-0"] input').should('have.attr', 'data-selected');
        }
      }
    });

    it('4. Should be consistent with maxPlay time', () => {
      const maxPLayTime = testData.mainAudio?.maxPlay ?? 1;

      // Remove click layer
      cy.assertRemoveClickLayer();

      // Initially audio button container should be enabled
      cy.get('[data-cy="audio-button-container"]').should('exist');
      if (maxPLayTime > 0) {
        // Click the audio button maxPLayTime times
        for (let i = 0; i < maxPLayTime; i++) {
          cy.get('[data-cy="speaker-icon"]').click();
          cy.wait(7000); // pause between clicks
        }
        // After maxPlayTime exceeded, the container should be disabled
        cy.get('[data-cy="audio-button-container-disabled"]').should('exist');
      }
    });

    it('5. Should be limitless clickable when maxPlay is 0', () => {
      // Set up test data
      cy.setupTestData(subject, `${interactionType}_maxPlay_0_test.json`, `${interactionType}`);

      // A number to test it is more times clickable
      const clickTime = 5;

      // Initially audio button container should be enabled
      cy.get('[data-cy="audio-button-container"]').should('exist');

      // Click the audio button maxPLayTime times
      for (let i = 0; i < clickTime; i++) {
        cy.get('[data-cy="speaker-icon"]').click();
        cy.wait(3000); // pause between clicks
      }
      // After many times clicked, the container should still exist
      cy.get('[data-cy="audio-button-container"]').should('exist');
    });

    // TODO: check if this is still needed and add the test case
    // it('the button should move when animateButton is true', () => {
    //   // write a test about animateButton
    // });
  });
}
