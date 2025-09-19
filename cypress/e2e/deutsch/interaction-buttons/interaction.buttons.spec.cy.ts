import { InteractionButtonParams, UnitDefinition } from '../../../../projects/player/src/app/models/unit-definition';
import { testMainAudioFeatures } from '../shared/main-audio.spec.cy';
import { testContinueButtonFeatures } from '../shared/continue-button.spec.cy';
import { testRibbonBars } from '../shared/ribbon-bar.spec.cy';

describe('BUTTONS Interaction E2E Tests', () => {
  const subject = 'deutsch';
  const interactionType = 'buttons';
  const defaultTestFile = 'buttons_test';

  const assertButtonExists = () => {
    cy.get('[data-cy="button-0"]').should('exist');
  };

  it('1a. Should handle single button selection when multiSelect is false\n', () => {
    // Set up test data
    cy.setupTestData(subject, defaultTestFile, interactionType);

    // Remove click layer
    cy.assertRemoveClickLayer();

    // Click first button
    cy.get('[data-cy="button-0"]').click();
    cy.get('[data-cy="button-0"] input').should('have.attr', 'data-selected', 'true');

    // Click second button - should deselect first
    cy.get('[data-cy="button-1"]').click();
    cy.get('[data-cy="button-0"] input').should('have.attr', 'data-selected', 'false');
    cy.get('[data-cy="button-1"] input').should('have.attr', 'data-selected', 'true');
  });

  it('1b. Should handle multi-selection when enabled', () => {
    // Set up test data
    cy.setupTestData(subject, 'buttons_multiselect_true_test', interactionType);

    // Wait for the component to re-render
    assertButtonExists();

    // Test multi-selection
    cy.get('[data-cy="button-0"]').click();
    cy.get('[data-cy="button-1"]').click();

    cy.get('[data-cy="button-0"] input').should('have.attr', 'data-selected', 'true');
    cy.get('[data-cy="button-1"] input').should('have.attr', 'data-selected', 'true');
  });

  it('2. Should respect button layout (numberOfRows)', () => {
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
      cy.setupTestData(subject, file, interactionType);

      // Check that the correct number of rows exists
      cy.get('[data-cy^="button-row-"]').should('have.length', rows).then(() => {
        cy.log(`Verified ${rows} rows exist`);
      });

      // Check each row has the correct number of buttons
      layout.forEach((expectedButtonsInRow, rowIndex) => {
        cy.log(`Testing row ${rowIndex}: expecting ${expectedButtonsInRow} buttons`);

        // Get the specific row (rows are indexed from 0)
        cy.get(`[data-cy="button-row-${rowIndex}"]`)
          .should('exist')
          .within(() => {
            // Count buttons within this specific row
            cy.get('stars-standard-button[data-cy^="button-"]')
              .should('have.length', expectedButtonsInRow)
              .then(() => {
                cy.log(`Row ${rowIndex} has ${expectedButtonsInRow} buttons`);
              });
          });
      });

      // Check that the correct number of total buttons exists
      const totalButtons = layout.reduce((sum, count) => sum + count, 0);
      cy.get('stars-standard-button[data-cy^="button-"]').should('have.length', totalButtons).then(() => {
        cy.log(`Total buttons: ${totalButtons}`);
      });
    });
  });

  it('3. Should handle different button types (BIG_SQUARE, TEXT, etc.)', () => {
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
      cy.setupTestData(subject, file, interactionType);

      // Wait for the component to render
      assertButtonExists();

      // Test the specific button type
      const expectedClass = `${buttonType.toLowerCase()}-type`;

      cy.get('[data-cy="button-0"]')
        .find('[data-cy="input-wrapper"]')
        .should('have.class', expectedClass);
    });
  });

  it('4a. Should have an image on the given position, if there is an imageSource parameter', () => {
    let testData: UnitDefinition;
    // Set up test data
    cy.setupTestData(subject, defaultTestFile, interactionType);
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const buttonParams = testData.interactionParameters as InteractionButtonParams;

      const imageSource = buttonParams.imageSource;
      const imagePosition = buttonParams.imagePosition;

      if (imageSource && imageSource.trim() !== '') {
        // Remove click layer
        cy.assertRemoveClickLayer();
        // Check if there is an image
        cy.get('[data-cy="stimulus-image"]').should('exist').and('be.visible');

        if (imagePosition === 'LEFT') {
        // Check if the image is on the left
          cy.get('[data-cy="buttons-container"]').should('have.class', 'flex-row');
        }
      }
    });
  });

  it('4b. Should not have an image on the given position, if imageSource parameter is empty', () => {
    let testData: UnitDefinition;

    // Set up test data
    cy.setupTestData(subject, 'buttons_imageSource_empty_test', interactionType);
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const buttonParams = testData.interactionParameters as InteractionButtonParams;
      const imageSource = buttonParams.imageSource;
      if (imageSource === '') {
        cy.get('[data-cy="stimulus-image"]')
          .should('not.exist');
      }
    });
  });

  it('5a. Should have a text under the buttons, If there is a text parameter', () => {
    let testData: UnitDefinition;
    // Set up test data
    cy.setupTestData(subject, defaultTestFile, interactionType);
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const buttonParams = testData.interactionParameters as InteractionButtonParams;
      const instructionText = buttonParams.text;

      if (instructionText && instructionText.trim() !== '') {
        cy.get('[data-cy="instruction-text"]').should('exist').and('contain', instructionText);
      }
    });
  });

  it('5b. Should not display instruction text when text parameter is empty string', () => {
    // Set up test data
    cy.setupTestData(subject, 'buttons_text_empty_test', interactionType);

    // Wait for buttons to be rendered
    assertButtonExists();

    // Verify that instruction text does not exist when text is empty string
    cy.get('[data-cy="instruction-text"]').should('not.exist');
  });

  it('6. Should handle different button options (imageSource, icon, text)', () => {
    const buttonOptionsConfigs = [
      {
        options: {
          buttons: [
            {
              imageSource: 'data:image/png;base64,'
            }
          ]
        },
        file: `${defaultTestFile}.json`
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
      const button = buttons![0]!;

      let key: string;
      if ('imageSource' in button) key = 'imageSource';
      else if ('icon' in button) key = 'icon';
      else if ('text' in button) key = 'text';
      else throw new Error('Unknown button type');

      cy.log(`Testing button options: ${key}`);

      // Set up test data
      cy.setupTestData(subject, file, interactionType);

      cy.get(`[data-cy=button-with-${key}]`).should('exist');
    });
  });

  // Import and run shared tests for the BUTTONS interaction type
  testContinueButtonFeatures(subject, interactionType);
  testMainAudioFeatures(subject, interactionType, defaultTestFile);
  testRibbonBars(subject, interactionType);
});
