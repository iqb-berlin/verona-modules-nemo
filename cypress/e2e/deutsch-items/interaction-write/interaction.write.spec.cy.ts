//import { testMainAudioFeatures } from '../shared/main-audio.spec.cy';
//import { testContinueButtonFeatures } from '../shared/continue-button.spec.cy';

describe('WRITE Interaction E2E Tests', () => {
  const itemName = 'deutsch';
  const interactionType = 'write';
  const defaultTestFile = 'write_test';

  // Import and run shared tests for buttons
  // testContinueButtonFeatures(itemName, interactionType, defaultTestFile);
  // testMainAudioFeatures(itemName, interactionType, defaultTestFile);

  beforeEach(() => {
    cy.setupTestData(itemName, defaultTestFile, interactionType);
  });

  it('1. Should have stimulus wrapper with an image inside', () => {
    cy.get('[data-testid=stimulus-wrapper]')
      .find('[data-testid=stimulus-image]')
      .should('exist');
  });

  it('2. Should have a text wrapper with a text span inside', () => {
    cy.get('[data-testid=text-wrapper]')
      .find('[data-testid=text-span]')
      .should('exist');
  });

  it('2. Should have a keyboard wrapper', () => {
  });

  it('2. Should display the text written by keyboard', () => {
  });

  it('2. Should allow the text maxInputLength length', () => {
  });

  it('2. Should add a backspace key if addBackspaceKey param is true', () => {
  });

  it('2. Should add äöü if addUmlautKeys param is true', () => {
  });

  it('2. Should add the buttons inside keysToAdd param', () => {
  });

  it('2. Should show the continue button on any response', () => {
  });
});

// continue button works different for write since there is no options to click
