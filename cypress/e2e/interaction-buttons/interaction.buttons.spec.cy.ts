import { testMainAudioFeatures } from '../shared/main-audio.spec.cy';
import { testContinueButtonFeatures } from '../shared/continue-button.spec.cy';

describe('BUTTONS Interaction E2E Tests', () => {
  let testData: any;
  beforeEach(() => {
    cy.setupTestData('buttons_test', 'buttons');
    cy.get('@testData').then(data => {
      testData = data;
    });
  });

  it('1. should have continue button', () => {
    cy.get('[data-testid="continue-button"]').should('exist');
  });

  it('2. should have audio button', () => {
    if (testData.mainAudio?.audioSource) {
      cy.get('[data-testid="speaker-icon"]').should('exist');
    }
  });

  it('3a. should handle single button selection when multiSelect is false\n', () => {
    if (!testData.interactionParameters?.multiSelect) {
      // Remove click layer if needed
      if (testData.mainAudio?.firstClickLayer) {
        cy.get('[data-testid="click-layer"]').click();
      }

      // Click first button
      cy.get('[data-testid="button-0"]').click();
      cy.get('[data-testid="button-0"] input').should('have.attr', 'data-selected', 'true');

      // Click second button - should deselect first
      cy.get('[data-testid="button-1"]').click();
      cy.get('[data-testid="button-0"] input').should('have.attr', 'data-selected', 'false');
      cy.get('[data-testid="button-1"] input').should('have.attr', 'data-selected', 'true');
    }
  });

  it('3b. should handle multi-selection when enabled', () => {
    cy.setupTestData('buttons_multiselect_true_test', 'buttons');
    cy.get('@testData').then(data => {
      testData = data;
    });
    // Wait for the component to re-render
    cy.get('[data-testid="button-0"]').should('exist');

    // Test multi-selection
    cy.get('[data-testid="button-0"]').click();
    cy.get('[data-testid="button-1"]').click();

    cy.get('[data-testid="button-0"] input').should('have.attr', 'data-selected', 'true');
    cy.get('[data-testid="button-1"] input').should('have.attr', 'data-selected', 'true');
  });

  // TODO: test all the possible layout examples
  it('4. should respect button layout (numberOfRows)', () => {
    // Based on interactionParameters.numberOfRows: 2
    const expectedRows = testData.interactionParameters?.numberOfRows || 1;
    const totalButtons = testData.interactionParameters?.options?.buttons?.length || 0;

    // Remove click layer if needed
    if (testData.mainAudio?.firstClickLayer) {
      cy.get('[data-testid="click-layer"]').click();
    }

    // Check that the correct number of rows exists
    cy.get('[data-testid^="button-row-"]').should('have.length', expectedRows);

    // Check that the correct number of buttons exists
    cy.get('stars-standard-button[data-testid^="button-"]').should('have.length', totalButtons);
  });

  it('5. should handle different button types (BIG_SQUARE, TEXT, etc.)', () => {
    const buttonTypes = ['MEDIUM_SQUARE', 'BIG_SQUARE', 'SMALL_SQUARE', 'TEXT', 'CIRCLE'];

    buttonTypes.forEach((buttonType, index) => {
      cy.then(() => {
        // Create modified test data
        const modifiedTestData = { ...testData };
        modifiedTestData.interactionParameters.buttonType = buttonType;

        const tempFileName = `temp_${buttonType.toLowerCase()}_test.json`;

        // Write temporary fixture
        cy.writeFile(`cypress/fixtures/${tempFileName}`, modifiedTestData);

        // Visit and load
        cy.visit('http://localhost:4200');
        cy.loadUnit(tempFileName);

        // Handle click layer
        if (testData.mainAudio?.firstClickLayer) {
          cy.get('[data-testid="click-layer"]').click();
        }

        // Wait for component to render
        cy.get('[data-testid="button-0"]').should('exist');

        // Test the specific button type
        const expectedClass = `${buttonType.toLowerCase()}-type`;

        cy.get('[data-testid="button-0"]')
          .find('[data-testid="input-wrapper"]')
          .should('have.class', expectedClass);
        // Clean up temporary file
        cy.task('deleteFile', `cypress/fixtures/${tempFileName}`);
      });
    });
  });

  it('6a. should have an image on the given position, if there is an imageSource parameter', () => {
    const imageSource = testData.interactionParameters?.imageSource;
    const imagePosition = testData.interactionParameters?.imagePosition;

    if (imageSource && imageSource.trim() !== '') {
      // Remove click layer if needed
      if (testData.mainAudio?.firstClickLayer) {
        cy.get('[data-testid="click-layer"]').click();
      }
      cy.get('[data-testid="stimulus-image"]').should('exist').and('be.visible');

      if (imagePosition === 'LEFT') {
        cy.get('[data-testid="buttons-container"]').should('have.class', 'flex-row');
      }
    }
  });

  it('6b. should not have an image on the given position, if imageSource parameter is empty', () => {
    cy.setupTestData('buttons_imageSource_empty_test', 'buttons');
    cy.get('@testData').then(data => {
      testData = data;
    });

    const imageSource = testData.interactionParameters?.imageSource;
    if (imageSource === '') {
      // Remove click layer if needed
      if (testData.mainAudio?.firstClickLayer) {
        cy.get('[data-testid="click-layer"]')
          .click();
      }
      cy.get('[data-testid="stimulus-image"]')
        .should('not.exist');
    }
  });

  it('7a. should have a text under the buttons, If there is a text parameter', () => {
    const instructionText = testData.interactionParameters?.text;

    if (instructionText && instructionText.trim() !== '') {
      cy.get('[data-testid="instruction-text"]').should('exist').and('contain', instructionText);
    } else {
      cy.get('[data-testid="instruction-text"]').should('not.exist');
    }
  });

  it('7b. should not display instruction text when text parameter is empty string', () => {
    cy.setupTestData('buttons_text_empty_test', 'buttons');
    cy.get('@testData').then(data => {
      testData = data;
    });

    // Remove click layer if needed
    if (testData.mainAudio?.firstClickLayer) {
      cy.get('[data-testid="click-layer"]').click();
    }

    // Wait for buttons to be rendered
    cy.get('[data-testid="button-0"]').should('exist');

    // Verify that instruction text does not exist when text is empty string
    cy.get('[data-testid="instruction-text"]').should('not.exist');
  });

  // TODO: add test case when options.buttons has icon or text instead of imageSource
  // it('should validate response data structure', () => {
  // });

  // it('should validate response data structure', () => {
  // });
});

// Import and run shared tests for buttons
testMainAudioFeatures('BUTTONS', 'buttons_test');
testContinueButtonFeatures('BUTTONS', 'buttons_test');
