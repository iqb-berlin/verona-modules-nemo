import {
  InteractionDropParams,
  UnitDefinition
} from '../../../../projects/player/src/app/models/unit-definition';
import { testMainAudioFeatures } from '../shared/main-audio.spec.cy';
import { testContinueButtonFeatures } from '../shared/continue-button.spec.cy';
import { testRibbonBars } from '../shared/ribbon-bar.spec.cy';
import { testAudioFeedback } from '../shared/audio-feedback.spec.cy';
import {
  calculateButtonCenter,
  getDropLandingTranslate
} from '../../../../projects/player/src/app/shared/utils/interaction-drop.util';

describe('DROP Interaction E2E Tests', () => {
  const subject = 'deutsch';
  const interactionType = 'drop';
  const defaultTestFile = 'drop_4_option_test';

  /**
  * Function to extract transform translate values
   * @param {string} styleValue - The style attribute value to parse
   * @returns {{xValue: string, yValue: string}} - An object containing the extracted x and y values
  * */
  const getTransformTranslateValues = (styleValue: string): { xValue: string; yValue: string; } => {
    const transformMatch = styleValue.match(/transform:\s*translate\(([^,]+),\s*([^)]+)\)/);
    const [, xValue = '', yValue = ''] = transformMatch || [];

    return {
      xValue: xValue.trim(),
      yValue: yValue.trim()
    };
  };

  const assertStartAnimation = (buttonIndex: number): void => {
    // Remove click layer
    cy.removeClickLayer();

    // Click button to start animation
    cy.get(`[data-cy="button-${buttonIndex}"]`).click();
  };

  it('1. Should have correct number of options', () => {
    let testData: UnitDefinition;
    // Set up test data
    cy.setupTestData(subject, defaultTestFile, interactionType);
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const dropParams = testData.interactionParameters as InteractionDropParams;
      const optionsLength = dropParams.options?.length;
      // Check if the correct number of options exists (rows are indexed from 0)
      cy.get('stars-standard-button[data-cy^="button-"]').should('have.length', optionsLength).then(() => {
        cy.log(`Total options: ${optionsLength}`);
      });
    });
  });

  it('2a. Should apply correct styles when imagePosition === BOTTOM', () => {
    let testData: UnitDefinition;
    // Set up test data
    cy.setupTestData(subject, defaultTestFile, interactionType);
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const dropParams = testData.interactionParameters as InteractionDropParams;

      const imagePosition = dropParams.imagePosition;
      if (imagePosition === 'BOTTOM') {
        // First, check if the container has the correct flex-direction
        cy.get('[data-cy="drop-container"]')
          .should('have.css', 'flex-direction', 'column-reverse');

        // Start animation
        assertStartAnimation(0);

        cy.get('[data-cy="drop-animate-wrapper"]')
          .should('have.attr', 'style')
          .then($style => {
            const styleValue = $style.toString();
            const { yValue } = getTransformTranslateValues(styleValue);
            // Image position is BOTTOM, check Y value (downward movement)
            expect(yValue.trim()).to.equal('280px');
          });
      }
    });
  });

  it('2b. Should apply correct styles when imagePosition === TOP', () => {
    let testData: UnitDefinition;
    // Set up test data
    cy.setupTestData(subject, `${interactionType}_imagePosition_top_test`, interactionType);
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const dropParams = testData.interactionParameters as InteractionDropParams;

      const imagePosition = dropParams.imagePosition;
      if (imagePosition === 'TOP') {
        // First, check if the container has the correct flex-direction
        cy.get('[data-cy="drop-container"]')
          .should('have.css', 'flex-direction', 'column');

        // Start animation
        assertStartAnimation(0);

        cy.get('[data-cy="drop-animate-wrapper"]')
          .should('have.attr', 'style')
          .then($style => {
            const styleValue = $style.toString();
            const { yValue } = getTransformTranslateValues(styleValue);
            // Image position is TOP, check Y value (upward movement)
            expect(yValue.trim()).to.equal('-280px');
          });
      }
    });
  });

  it('3. Should apply correct transform values when imageLandingXY values exists', () => {
    let testData: UnitDefinition;
    // Set up test data
    cy.setupTestData(
      subject,
      `${interactionType}_imagePosition_top_rectangle_with_imageLandingXY_test`,
      interactionType
    );
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const dropParams = testData.interactionParameters as InteractionDropParams;
      const totalButtons = dropParams.options?.length;
      const imageLandingXY = dropParams.imageLandingXY;
      const buttonIndex = 2;

      const { currentButtonCenter } = calculateButtonCenter(totalButtons, buttonIndex);

      if (imageLandingXY !== '') {
        const {
          xPx,
          yPx
        } = getDropLandingTranslate(imageLandingXY, currentButtonCenter);

        // Start animation
        assertStartAnimation(buttonIndex);

        cy.get('[data-cy="drop-animate-wrapper"]')
          .eq(buttonIndex)
          .should('have.attr', 'style')
          .should('include', 'transform: translate(')
          .then($style => {
            const styleValue = $style!.toString();
            const {
              xValue,
              yValue
            } = getTransformTranslateValues(styleValue);
            expect(xValue.trim())
              .to
              .equal(xPx);
            expect(yValue.trim())
              .to
              .equal(yPx);
          });
      }
    });
  });

  it('4. Should move the option back to initial position when clicked again', () => {
    // Set up test data
    cy.setupTestData(subject, defaultTestFile, interactionType);

    // Remove click layer
    cy.removeClickLayer();

    // Button to click
    const buttonIndex = 0;

    // First click - button should move down
    cy.get(`[data-cy="button-${buttonIndex}"]`).click();

    // Wait for animation to complete
    cy.wait(3000);

    // Second click - button should return to original position
    cy.get(`[data-cy="button-${buttonIndex}"]`).click();
    cy.get('[data-cy="drop-animate-wrapper"]')
      .should($el => {
        const style = $el.attr('style') || '';
        // Style should either not contain transform, or transform should be empty/none
        if (style.includes('transform')) {
          expect(style).to.not.include('translate');
        }
      });
  });

  // Import and run shared tests for the DROP interaction type
  testContinueButtonFeatures(subject, interactionType);
  testMainAudioFeatures(subject, interactionType, defaultTestFile);
  testRibbonBars(subject, interactionType);
  testAudioFeedback(subject, interactionType);
});
