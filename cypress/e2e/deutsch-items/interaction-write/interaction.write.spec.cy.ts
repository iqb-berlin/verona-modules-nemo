import { testMainAudioFeatures } from '../shared/main-audio.spec.cy';
import { testContinueButtonFeatures } from '../shared/continue-button.spec.cy';

describe('WRITE Interaction E2E Tests', () => {
  const itemName = 'deutsch';
  const interactionType = 'write';
  const defaultTestFile = 'write_test';

  // Import and run shared tests for buttons
  testContinueButtonFeatures(itemName, interactionType, defaultTestFile);
  testMainAudioFeatures(itemName, interactionType, defaultTestFile);

  beforeEach(() => {
    cy.setupTestData(itemName, defaultTestFile, interactionType);
  });

  it('1. Should have stimulus wrapper with an image inside', () => {
    cy.get('[data-testid=stimulus-wrapper]')
      .find('[data-testid=stimulus-image]')
      .should('exist');
  });

  it('2. Should have a text-wrapper and text-display elements', () => {
    cy.get('[data-testid=text-wrapper]')
      .find('[data-testid=text-display]')
      .should('exist');
  });

  it('3. Should have a keyboard wrapper', () => {
    cy.get('[data-testid=keyboard-wrapper]').should('exist');
  });

  it('4. Should display the text written by keyboard', () => {
    const text = ['k', 'o', 'p', 'f'];

    // Remove click layer
    cy.get('[data-testid="click-layer"]').click();

    text.forEach(char => {
      cy.get(`[data-testid=character-button-${char}]`).click();
    });
    cy.get('[data-testid=text-span]').should('contain', 'Kopf');
  });

  it('5. Should allow the text maxInputLength length', () => {
    let testData: any;
    cy.get('@testData').then(data => {
      testData = data;
      const maxInputLength = testData.interactionParameters?.maxInputLength;

      // Create an array of maxInputLength letters
      const letters = Array.from({ length: maxInputLength }, () => {
        const code = 97 + Math.floor(Math.random() * 26); // a-z
        return String.fromCharCode(code);
      });

      // Remove click layer
      cy.get('[data-testid="click-layer"]').click();

      letters.forEach(letter => {
        cy.get(`[data-testid=character-button-${letter}]`).click();
      });

      // Check if the text is displayed correctly
      cy.get('[data-testid=text-span]')
        .invoke('text')
        .then(text => {
          expect(text.length).to.equal(maxInputLength);
        });

      // Check if I can type more characters
      cy.get('[data-testid=character-button-k]').should('be.disabled');
    });
  });

  it('6. Should add a backspace key if addBackspaceKey param is true', () => {
    let testData: any;
    cy.get('@testData').then(data => {
      testData = data;
      const addBackspaceKey = testData.interactionParameters?.addBackspaceKey;

      if (addBackspaceKey) {
        cy.get('[data-testid=backspace-button]').should('exist');
        cy.log('Backspace button exists');
      }
    });
  });

  it('7. Should add äöü if addUmlautKeys param is true', () => {
    let testData: any;
    const umlautKeys = ['ä', 'ö', 'ü'];
    cy.get('@testData').then(data => {
      testData = data;
      const addUmlautKeys = testData.interactionParameters?.addUmlautKeys;

      if (addUmlautKeys) {
        umlautKeys.forEach(key => {
          cy.get(`[data-testid=grapheme-button-${key}]`).should('exist');
          cy.log(`${key} grapheme key exists`);
        });
      }
    });
  });

  it('8. Should add the buttons inside keysToAdd param', () => {
    let testData: any;

    cy.get('@testData').then(data => {
      testData = data;
      const extraKeyboardKeys = testData.interactionParameters?.keysToAdd;

      if (extraKeyboardKeys.length > 0) {
        extraKeyboardKeys.forEach((key:string) => {
          cy.get(`[data-testid=keyboard-button-${key}]`).should('exist');
          cy.log(`${key} extra keyboard key exists`);
        });
      }
    });
  });
});
