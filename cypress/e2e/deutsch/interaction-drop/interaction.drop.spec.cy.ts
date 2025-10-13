import {
  InteractionDropParams,
  UnitDefinition
} from '../../../../projects/player/src/app/models/unit-definition';
import { testMainAudioFeatures } from '../shared/main-audio.spec.cy';
import { testContinueButtonFeatures } from '../shared/continue-button.spec.cy';
import { testRibbonBars } from '../shared/ribbon-bar.spec.cy';
import { testAudioFeedback } from '../shared/audio-feedback.spec.cy';
import {
  getDropLandingArgs,
  getDropLandingTranslate
} from '../../../../projects/player/src/app/shared/utils/interaction-drop.util';

describe('DROP Interaction E2E Tests', () => {
  const subject = 'deutsch';
  const interactionType = 'drop';
  const defaultTestFile = 'drop_4_option_test';
  const testFileWithImageLandingXY = `${interactionType}_imagePosition_top_rectangle_with_imageLandingXY_100-100_test`;
  const yValueToBottom = 280; // Ref from the value on interaction-drop.component.ts calculateAnimationPosition function
  const yValueToTop = -280; // Ref from the value on interaction-drop.component.ts calculateAnimationPosition function
  const dropImage = '[data-cy="drop-image"]';
  const buttonIndex = 1;

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

  /**
   * Sets up test data with imageLandingXY and retrieves DOM elements needed for drop interaction tests.
   * Calculates landing coordinates and transform values for the drop animation.
   *
   * @returns {Cypress.Chainable<object>} - Chainable resolving to calculated test values and DOM elements.
   */
  const getTestSetupWithImageLandingXY = (
  ): Cypress.Chainable<any> => {
    cy.setupTestData(subject, testFileWithImageLandingXY, interactionType);

    return cy.get('@testData').then(data => {
      const testData = data as unknown as UnitDefinition;
      const dropParams = testData.interactionParameters as InteractionDropParams;
      const imageLandingXY = dropParams.imageLandingXY;

      return cy.get(dropImage).then($img => {
        return cy.get(`[data-cy="button-${buttonIndex}"]`).then($button => {
          return cy.get('[data-cy="drop-container"]').then($container => {
            const imgElement = $img.get(0) as HTMLImageElement;
            const buttonElement = $button.get(0) as HTMLElement;
            const containerElement = $container.get(0) as HTMLElement;

            const {
              buttonCenterX, imgWidth, imgHeight, imageTop, imageLeft, buttonCenterY
            } = getDropLandingArgs(imgElement, buttonElement, containerElement);

            let xPx = '';
            let yPx = '';
            if (imageLandingXY !== '') {
              const translate = getDropLandingTranslate(
                imageLandingXY,
                buttonCenterX,
                imgWidth,
                imgHeight,
                imageLeft,
                imageTop,
                buttonCenterY
              );
              xPx = translate.xPx;
              yPx = translate.yPx;
            }

            return {
              testData,
              dropParams,
              imageLandingXY,
              imgElement,
              buttonElement,
              containerElement,
              buttonCenterX,
              imgWidth,
              imgHeight,
              imageTop,
              imageLeft,
              buttonCenterY,
              xPx,
              yPx
            };
          });
        });
      });
    });
  };

  /**
   * Asserts that the drop-animate-wrapper element has the expected transform translate values.
   *
   * @param {string} xPx - The expected X translation value.
   * @param {string} yPx - The expected Y translation value.
   */
  const assertTransformTranslate = (xPx: string, yPx: string): void => {
    cy.get(`[data-cy="drop-animate-wrapper-${buttonIndex}"]`)
      .should('have.attr', 'style')
      .should('include', 'transform: translate(')
      .then($style => {
        const styleValue = $style!.toString();
        const { xValue, yValue } = getTransformTranslateValues(styleValue);
        expect(
          Number(xValue.replace('px', '')).toFixed(4)
        ).to.equal(
          Number(xPx.replace('px', '')).toFixed(4)
        );
        expect(
          Number(yValue.replace('px', '')).toFixed(4)
        ).to.equal(
          Number(yPx.replace('px', '')).toFixed(4)
        );
      });
  };

  const assertStartAnimation = (): void => {
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
        assertStartAnimation();

        cy.get(`[data-cy="drop-animate-wrapper-${buttonIndex}"]`)
          .should('have.attr', 'style')
          .then($style => {
            const styleValue = $style.toString();
            const { yValue } = getTransformTranslateValues(styleValue);
            // Image position is BOTTOM, check Y value (downward movement)
            expect(yValue.trim()).to.equal(`${yValueToBottom}px`);
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
        assertStartAnimation();

        cy.get(`[data-cy="drop-animate-wrapper-${buttonIndex}"]`)
          .should('have.attr', 'style')
          .then($style => {
            const styleValue = $style.toString();
            const { yValue } = getTransformTranslateValues(styleValue);
            // Image position is TOP, check Y value (upward movement)
            expect(yValue.trim()).to.equal(`${yValueToTop}px`);
          });
      }
    });
  });

  it('3. Should apply correct transform values when imageLandingXY values exists', () => {
    getTestSetupWithImageLandingXY().then(result => {
      const { imageLandingXY, xPx, yPx } = result as {
        imageLandingXY: string;
        xPx: string;
        yPx: string;
      };
      if (imageLandingXY !== '') {
        assertStartAnimation();
        assertTransformTranslate(xPx, yPx);
      }
    });
  });

  it('4. Should move the option back to initial position when clicked again', () => {
    // Set up test data
    cy.setupTestData(subject, defaultTestFile, interactionType);

    // Remove click layer
    cy.removeClickLayer();

    // First click - button should move down
    cy.get(`[data-cy="button-${buttonIndex}"]`).click();

    // Wait for animation to complete
    cy.wait(3000);

    // The second click-button should return to original position
    cy.get(`[data-cy="button-${buttonIndex}"]`).click();
    cy.get(`[data-cy="drop-animate-wrapper-${buttonIndex}"]`)
      .should($el => {
        const style = $el.attr('style') || '';
        // Style should either not contain transform, or transform should be empty/none
        if (style.includes('transform')) {
          expect(style).to.not.include('translate');
        }
      });
  });

  it('5. Should handle drag events correctly', () => {
    getTestSetupWithImageLandingXY().then(result => {
      const { imageLandingXY, xPx, yPx } = result as {
        imageLandingXY: string;
        xPx: string;
        yPx: string;
      };
      if (imageLandingXY !== '') {
        // Triggers the drag event
        cy.get(`[data-cy="drop-animate-wrapper-${buttonIndex}"]`)
          .trigger('mousedown', { button: 0, bubbles: true, force: true })
          .trigger('mousemove', { pageX: 10, pageY: 0, force: true });

        cy.get(dropImage) // droppable

          .trigger('mousemove', { position: 'center', force: true })
          .trigger('mouseup', { button: 0, bubbles: true, force: true });
        assertTransformTranslate(xPx, yPx);
      }
    });
  });

  // Import and run shared tests for the DROP interaction type
  testContinueButtonFeatures(subject, interactionType);
  testMainAudioFeatures(subject, interactionType, defaultTestFile);
  testRibbonBars(subject, interactionType);
  testAudioFeedback(subject, interactionType);
});
