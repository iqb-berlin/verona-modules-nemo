import { testMainAudioFeatures } from '../shared/main-audio.spec.cy';
import { testContinueButtonFeatures } from '../shared/continue-button.spec.cy';

describe('BUTTONS Interaction E2E Tests', () => {

  it('1. Should have continue button', () => {
    // Set up test data
    cy.setupTestData('buttons_test', 'buttons');
    // Check if continue button exists
    cy.get('[data-testid="continue-button"]').should('exist');
  });

  it('2. Should have audio button', () => {
    // Set up test data
    cy.setupTestData('buttons_test', 'buttons');
    // Check if speaker icon exists
    cy.get('[data-testid="speaker-icon"]').should('exist');
  });

  it('3a. Should handle single button selection when multiSelect is false\n', () => {
    // Set up test data
    cy.setupTestData('buttons_test', 'buttons');

    // Remove click layer
    cy.get('[data-testid="click-layer"]').click();

    // Click first button
    cy.get('[data-testid="button-0"]').click();
    cy.get('[data-testid="button-0"] input').should('have.attr', 'data-selected', 'true');

    // Click second button - should deselect first
    cy.get('[data-testid="button-1"]').click();
    cy.get('[data-testid="button-0"] input').should('have.attr', 'data-selected', 'false');
    cy.get('[data-testid="button-1"] input').should('have.attr', 'data-selected', 'true');
  });

  it('3b. Should handle multi-selection when enabled', () => {
    // Set up test data
    cy.setupTestData('buttons_multiselect_true_test', 'buttons');

    // Wait for the component to re-render
    cy.get('[data-testid="button-0"]').should('exist');

    // Test multi-selection
    cy.get('[data-testid="button-0"]').click();
    cy.get('[data-testid="button-1"]').click();

    cy.get('[data-testid="button-0"] input').should('have.attr', 'data-selected', 'true');
    cy.get('[data-testid="button-1"] input').should('have.attr', 'data-selected', 'true');
  });

  it('4. Should respect button layout (numberOfRows)', () => {
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

      // Set up test data
      cy.setupTestData(file, 'buttons');

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

  it('5. Should handle different button types (BIG_SQUARE, TEXT, etc.)', () => {
    const buttonTypeConfigs = [
      { buttonType: 'MEDIUM_SQUARE', file: 'buttons_buttonType_mediumSquare_test.json' },
      { buttonType: 'BIG_SQUARE', file: 'buttons_buttonType_bigSquare_test.json' },
      { buttonType: 'SMALL_SQUARE', file: 'buttons_buttonType_smallSquare_test.json' },
      { buttonType: 'TEXT', file: 'buttons_buttonType_text_test.json' },
      { buttonType: 'CIRCLE', file: 'buttons_buttonType_circle_test.json' }
    ];

    buttonTypeConfigs.forEach(({ buttonType, file }) => {
      cy.log(`Testing buttonType: ${buttonType}`);

      // Set up test data
      cy.setupTestData(file, 'buttons');

      // Wait for the component to render
      cy.get('[data-testid="button-0"]').should('exist');

      // Test the specific button type
      const expectedClass = `${buttonType.toLowerCase()}-type`;

      cy.get('[data-testid="button-0"]')
        .find('[data-testid="input-wrapper"]')
        .should('have.class', expectedClass);
    });
  });

  it('6a. Should have an image on the given position, if there is an imageSource parameter', () => {
    let testData: any;
    // Set up test data
    cy.setupTestData('buttons_test', 'buttons');
    cy.get('@testData').then(data => {
      testData = data;

      const imageSource = testData.interactionParameters?.imageSource;
      const imagePosition = testData.interactionParameters?.imagePosition;

      if (imageSource && imageSource.trim() !== '') {
        // Remove click layer
        cy.get('[data-testid="click-layer"]').click();
        // Check if there is an image
        cy.get('[data-testid="stimulus-image"]').should('exist').and('be.visible');

        if (imagePosition === 'LEFT') {
        // Check if the image is on the left
          cy.get('[data-testid="buttons-container"]').should('have.class', 'flex-row');
        }
      }
    });
  });

  it('6b. Should not have an image on the given position, if imageSource parameter is empty', () => {
    let testData: any;

    // Set up test data
    cy.setupTestData('buttons_imageSource_empty_test', 'buttons');
    cy.get('@testData').then(data => {
      testData = data;

      const imageSource = testData.interactionParameters?.imageSource;
      if (imageSource === '') {
        cy.get('[data-testid="stimulus-image"]')
          .should('not.exist');
      }
    });
  });

  it('7a. Should have a text under the buttons, If there is a text parameter', () => {
    let testData: any;
    // Set up test data
    cy.setupTestData('buttons_test', 'buttons');
    cy.get('@testData').then(data => {
      testData = data;

      const instructionText = testData.interactionParameters?.text;

      if (instructionText && instructionText.trim() !== '') {
        cy.get('[data-testid="instruction-text"]').should('exist').and('contain', instructionText);
      }
    });
  });

  it('7b. Should not display instruction text when text parameter is empty string', () => {
    // Set up test data
    cy.setupTestData('buttons_text_empty_test', 'buttons');

    // Wait for buttons to be rendered
    cy.get('[data-testid="button-0"]').should('exist');

    // Verify that instruction text does not exist when text is empty string
    cy.get('[data-testid="instruction-text"]').should('not.exist');
  });

  it('8. Should handle different button options (imageSource, icon, text)', () => {
    const buttonOptionsConfigs = [
      {
        options: {
          buttons: [
            {
              imageSource: 'data:image/png;base64,'
            }
          ]
        },
        file: 'buttons_test.json'
      },
      {
        options: {
          buttons: [
            {
              icon: 'CHECK_GREEN'
            }
          ]
        },
        file: 'buttons_option_icon_test.json'
      },
      {
        options: {
          buttons: [
            {
              text: 'A'
            }
          ]
        },
        file: 'buttons_option_text_test.json'
      }
    ];

    buttonOptionsConfigs.forEach(({ options: { buttons }, file }) => {
      const button = buttons[0];

      let key: string;
      if ('imageSource' in button) key = 'imageSource';
      else if ('icon' in button) key = 'icon';
      else if ('text' in button) key = 'text';
      else throw new Error('Unknown button type');

      cy.log(`Testing button options: ${key}`);

      // Set up test data
      cy.setupTestData(file, 'buttons');

      cy.get(`[data-testid=button-with-${key}]`).should('exist');
    });
  });
});

// Import and run shared tests for buttons
testMainAudioFeatures('buttons', 'buttons_test');
testContinueButtonFeatures('buttons');
