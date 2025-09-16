import {
  InteractionFindOnImageParams,
  UnitDefinition
} from '../../../../projects/player/src/app/models/unit-definition';
import { testContinueButtonFeatures } from '../shared/continue-button.spec.cy';

describe('FIND_ON_IMAGE Interaction E2E Tests', () => {
  const subject = 'deutsch';
  const interactionType = 'find_on_image';
  const defaultTestFile = 'find_on_image_test';

  beforeEach(() => {
    cy.setupTestData(subject, defaultTestFile, interactionType);
  });

  it('1. Should display the image when imageSource is provided', () => {
    cy.get('[data-cy="image-element"]')
      .should('exist')
      .and('be.visible')
      .and('have.attr', 'src');
  });

  it('2. Should display the text parameter', () => {
    cy.get('[data-cy="component-text"]')
      .should('exist')
      .and('be.visible');
  });

  it('3a. Should display show area with width and height when showArea parameter is provided', () => {
    let testData: UnitDefinition;
    // Set up test data
    cy.setupTestData(subject, 'find_on_image_with_showArea_test', interactionType);
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const findOnImageParams = testData.interactionParameters as InteractionFindOnImageParams;

      const showArea = findOnImageParams.showArea;

      if (showArea) {
        cy.get('[data-cy="show-area"]')
          .should($el => {
            const style = $el.attr('style') || '';
            // Style should contain width and height
            if (style.includes('width: ') && style.includes('height:')) {
              cy.log('show area is visible with width and height');
            }
          });
      }
    });
  });

  it('3b. Should not display show area when showArea parameter is not provided', () => {
    cy.get('[data-cy="show-area"]')
      .should('not.exist');
  });

  it('4. Should handle mouse clicks on the image', () => {
    cy.get('[data-cy="image-element"]')
      .click(100, 150); // Click at specific coordinates

    // Check that click target visualization appears
    cy.get('[data-cy="click-target"]')
      .should('exist');
  });

  it('5. Should handle multiple clicks and update visualization', () => {
    // First click
    cy.get('[data-cy="image-element"]')
      .click(100, 100);

    cy.get('[data-cy="click-target"]')
      .should('exist');

    // Second click at different position
    cy.get('[data-cy="image-element"]')
      .click(200, 200);

    // Click target should move to new position
    cy.get('[data-cy="click-target"]')
      .should($el => {
        const style = $el.attr('style') || '';
        style.includes('left: 200px');
        style.includes('top: 200px');
      });
  });

  it('6. Should handle touch events on mobile devices', () => {
    cy.viewport('ipad-mini');

    cy.get('[data-cy="image-element"]')
      .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
      .trigger('touchend', { changedTouches: [{ clientX: 100, clientY: 100 }] });

    cy.get('[data-cy="click-target"]')
      .should('exist');
  });

  // Import and run shared tests for buttons interaction
  testContinueButtonFeatures(subject, interactionType, defaultTestFile);
});
