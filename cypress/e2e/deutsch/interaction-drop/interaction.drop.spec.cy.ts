import {
  InteractionDropParams,
  UnitDefinition
} from '../../../../projects/player/src/app/models/unit-definition';
import { testMainAudioFeatures } from '../shared/main-audio.spec.cy';
import { testContinueButtonFeatures } from '../shared/continue-button.spec.cy';
import { testRibbonBars } from '../shared/ribbon-bar.spec.cy';
import { testAudioFeedback } from '../shared/audio-feedback.spec.cy';

describe('DROP Interaction E2E Tests', () => {
  const subject = 'deutsch';
  const interactionType = 'drop';
  const defaultTestFile = 'drop_4_option_test';

  beforeEach(() => {
    cy.setupTestData(subject, defaultTestFile, interactionType);
  });

  it('1. Should have correct number of options', () => {
    let testData: UnitDefinition;
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const dropParams = testData.interactionParameters as InteractionDropParams;
      const optionsLength = dropParams.options?.length;
      // Check if the correct number of options exist (rows are indexed from 0)
      cy.get('stars-standard-button[data-cy^="button-"]').should('have.length', optionsLength).then(() => {
        cy.log(`Total options: ${optionsLength}`);
      });
    });
  });

  it('2. Should apply correct transform values when option is clicked', () => {
    // Remove click layer
    cy.removeClickLayer();

    // Button to click
    const buttonIndex = 0;

    cy.get(`[data-cy="button-${buttonIndex}"]`).click();

    cy.get('[data-cy="drop-animate-wrapper"]')
      .should('have.attr', 'style')
      .then($style => {
        const styleValue = $style.toString();
        const transformMatch = styleValue.match(/transform:\s*translate\(([^,]+),\s*([^)]+)\)/);

        const [, xValue = '', yValue = ''] = transformMatch || [];

        // Check Y value (downward movement)
        expect(yValue.trim()).to.equal('230px');

        // Check X value is a number with px
        expect(xValue.trim()).to.match(/^-?\d+(\.\d+)?px$/);
      });
  });

  it('3. Should move the option back to initial position when clicked again', () => {
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
