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

  it('4. should respect button layout (numberOfRows)', () => {

    const layoutConfigs = [
      // 1 Row layouts
      { rows: 1, layout: [2], file: 'buttons_1Row_2_test.json' },
      { rows: 1, layout: [3], file: 'buttons_1Row_3_test.json' },
      { rows: 1, layout: [4], file: 'buttons_1Row_4_test.json' },
      { rows: 1, layout: [5], file: 'buttons_1Row_5_test.json' },

      // 2 Row layouts
      { rows: 2, layout: [1, 1], file: 'buttons_2Rows_1-1_test.json' },
      { rows: 2, layout: [2, 2], file: 'buttons_2Rows_2-2_test.json' },
      { rows: 2, layout: [3, 3], file: 'buttons_2Rows_3-3_test.json' },
      { rows: 2, layout: [4, 3], file: 'buttons_2Rows_4-3_test.json' },
      { rows: 2, layout: [4, 4], file: 'buttons_2Rows_4-4_test.json' },
      { rows: 2, layout: [5, 4], file: 'buttons_2Rows_5-4_test.json' },
      { rows: 2, layout: [5, 5], file: 'buttons_2Rows_5-5_test.json' },

      // 3 Row layouts
      { rows: 3, layout: [2, 2, 2], file: 'buttons_3Rows_2-2-2_test.json' },
      { rows: 3, layout: [5, 5, 1], file: 'buttons_3Rows_5-5-1_test.json' }
    ];

    layoutConfigs.forEach(({ rows, layout, file }) => {
      cy.log(`Testing layout: ${rows} rows with ${layout.join('-')} buttons`);

      cy.setupTestData(file, 'buttons');
      cy.get('@testData').then(data => {
        testData = data;
      });

      // Check that the correct number of rows exists
      cy.get('[data-testid^="button-row-"]').should('have.length', rows).then(() => {
        cy.log(`Verified ${rows} rows exist`);
      });

      // Check each row has the correct number of buttons
      layout.forEach((expectedButtonsInRow, rowIndex) => {
        cy.log(`Testing row ${rowIndex}: expecting ${expectedButtonsInRow} buttons`);

        // Get the specific row (rows are indexed from 0)
        cy.get(`[data-testid="button-row-${rowIndex}"]`)
          .should('exist')
          .within(() => {
            // Count buttons within this specific row
            cy.get('stars-standard-button[data-testid^="button-"]')
              .should('have.length', expectedButtonsInRow)
              .then(() => {
                cy.log(`Row ${rowIndex} has ${expectedButtonsInRow} buttons`);
              });
          });
      });

      // Check that the correct number of total buttons exists
      const totalButtons = layout.reduce((sum, count) => sum + count, 0);
      cy.get('stars-standard-button[data-testid^="button-"]').should('have.length', totalButtons).then(() => {
        cy.log(`Total buttons: ${totalButtons}`);
      });
    });
  });

  it('5. should handle different button types (BIG_SQUARE, TEXT, etc.)', () => {
    const buttonTypeConfigs = [
      { buttonType: 'MEDIUM_SQUARE', file: 'buttons_buttonType_mediumSquare_test.json' },
      { buttonType: 'BIG_SQUARE', file: 'buttons_buttonType_bigSquare_test.json' },
      { buttonType: 'SMALL_SQUARE', file: 'buttons_buttonType_smallSquare_test.json' },
      { buttonType: 'TEXT', file: 'buttons_buttonType_text_test.json' },
      { buttonType: 'CIRCLE', file: 'buttons_buttonType_circle_test.json' }
    ];

    buttonTypeConfigs.forEach(({ buttonType, file }) => {
      cy.log(`Testing buttonType: ${buttonType}`);

      cy.setupTestData(file, 'buttons');
      cy.get('@testData').then(data => {
        testData = data;
      });
      // Wait for the component to render
      cy.get('[data-testid="button-0"]').should('exist');

      // Test the specific button type
      const expectedClass = `${buttonType.toLowerCase()}-type`;

      cy.get('[data-testid="button-0"]')
        .find('[data-testid="input-wrapper"]')
        .should('have.class', expectedClass);
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
testMainAudioFeatures('buttons', 'buttons_test');
testContinueButtonFeatures('buttons', 'buttons_test');
