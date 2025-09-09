export function testMainAudioFeatures(interactionType: string, configFile: string) {
  describe(`Main Audio Features - ${interactionType}`, () => {
    let testData: any;

    beforeEach(() => {
      cy.setupTestData(configFile, interactionType);
      cy.get('@testData').then(data => {
        testData = data;
      });
    });

    it('Should handle firstClickLayer correctly', () => {
      if (testData.mainAudio?.firstClickLayer) {
        cy.get('[data-testid="click-layer"]').should('exist').and('be.visible');

        // Click anywhere on the screen to enable interactions
        cy.get('[data-testid="click-layer"]').click();

        // After clicking, the layer should disappear
        cy.get('[data-testid="click-layer"]').should('not.exist');
        // Now interactions should be possible (unless disableInteractionUntilComplete is also true)
        if (!testData.mainAudio?.disableInteractionUntilComplete) {
          cy.get('[data-testid="button-0"]').should('be.visible').click();
          cy.get('[data-testid="button-0"]').should('have.class', 'selected');
        }
      }
    });

    it('Should wait for audio completion when disableInteractionUntilComplete is true', () => {
      if (testData.mainAudio?.disableInteractionUntilComplete) {
        // Initially, the interaction should be disabled with overlay visible
        cy.get('[data-testid="interaction-disabled-overlay"]').should('exist');

        // Click anywhere on the screen to enable interactions
        cy.get('[data-testid="click-layer"]').click();

        // Click the audio button to start playing
        cy.get('[data-testid="speaker-icon"]').click();

        // Wait for audio to complete
        cy.wait(3000);

        // After audio completion, the overlay should disappear
        cy.get('[data-testid="interaction-disabled-overlay"]').should('not.exist');

        // Now buttons should be clickable
        cy.get('[data-testid="button-0"]').click();
        cy.get('[data-testid="button-0"] input').should('have.attr', 'data-selected');
      }
    });

    it.only('Should be consistent with maxPlay time', () => {
      const maxPLayTime = testData.mainAudio?.maxPlay;

      // Remove click layer
      cy.get('[data-testid="click-layer"]').click();

      // Initially audio button container should be enabled
      cy.get('[data-testid="audio-button-container"]').should('exist');
      if (maxPLayTime > 0) {
        // Click the audio button maxPLayTime times
        for (let i = 0; i < maxPLayTime; i++) {
          cy.get('[data-testid="speaker-icon"]').click();
          cy.wait(3000); // pause between clicks
        }
        // After maxPlayTime exceeded, the container should be disabled
        cy.get('[data-testid="audio-button-container-disabled"]').should('exist');
      }
    });

    it('Should be limitless clickable when maxPlay is 0', () => {
      // Set up test data
      cy.setupTestData(`${interactionType}_maxPlay_0_test.json`, `${interactionType}`);

      // A number to test it is more times clickable
      const clickTime = 5;

      // Initially audio button container should be enabled
      cy.get('[data-testid="audio-button-container"]').should('exist');

      // Click the audio button maxPLayTime times
      for (let i = 0; i < clickTime; i++) {
        cy.get('[data-testid="speaker-icon"]').click();
        cy.wait(3000); // pause between clicks
      }
      // After many times clicked, the container should still exist
      cy.get('[data-testid="audio-button-container"]').should('exist');
    });

    // TODO: check if this is still needed and add the test case
    // it('the button should move when animateButton is true', () => {
    //   // write a test about animateButton
    // });
  });
}
