import { testMainAudioFeatures } from '../shared/main-audio.spec.cy';
import { testRibbonBars } from '../shared/ribbon-bar.spec.cy';

describe('IMAGE_ONLY Interaction E2E Tests', () => {
  const subject = 'deutsch';
  const interactionType = 'image_only';
  const defaultTestFile = 'image_only_test';

  beforeEach(() => {
    // Set up test data
    cy.setupTestData(subject, defaultTestFile, interactionType);
  });

  it('1. Should display imageSource', () => {
    // Check if the imageSource is displayed
    cy.get('[data-cy="stimulus-image"]')
      .should('have.attr', 'src')
      .and($src => expect($src).to.not.be.empty);
  });

  it('2. Should show the continue button after the main audio is complete', () => {
    // Continue button should NOT exist initially
    cy.assertContinueButtonNotExists();

    // Remove click layer
    cy.removeClickLayer();

    // Start the audio
    cy.get('[data-cy="speaker-icon"]').click();

    // Continue button should NOT exist after clicking the video button
    cy.assertContinueButtonNotExists();

    // Wait for the audio to finish
    cy.waitUntilAudioIsFinishedPlaying();

    // Continue button should appear
    cy.assertContinueButtonExistsAndVisible();
  });

  // Import and run shared tests for the IMAGE_ONLY interaction type
  testMainAudioFeatures(subject, interactionType, defaultTestFile);
  testRibbonBars(subject, interactionType);
});
