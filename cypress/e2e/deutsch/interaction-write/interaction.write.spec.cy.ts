import { InteractionWriteParams, UnitDefinition } from '../../../../projects/player/src/app/models/unit-definition';
import { testMainAudioFeatures } from '../shared/main-audio.spec.cy';
import { testContinueButtonFeatures } from '../shared/continue-button.spec.cy';
import { testRibbonBars } from '../shared/ribbon-bar.spec.cy';

describe('WRITE Interaction E2E Tests', () => {
  const subject = 'deutsch';
  const interactionType = 'write';
  const defaultTestFile = 'write_test';

  beforeEach(() => {
    cy.setupTestData(subject, defaultTestFile, interactionType);
  });

  it('1. Should have stimulus wrapper with an image inside', () => {
    cy.get('[data-cy=stimulus-wrapper]')
      .find('[data-cy=stimulus-image]')
      .should('exist');
  });

  it('2. Should have a text-wrapper and text-display elements', () => {
    cy.get('[data-cy=text-wrapper]')
      .find('[data-cy=text-display]')
      .should('exist');
  });

  it('3. Should have a keyboard wrapper', () => {
    cy.get('[data-cy=keyboard-wrapper]').should('exist');
  });

  it('4. Should display the text written by keyboard', () => {
    const text = ['k', 'o', 'p', 'f'];

    // Remove click layer
    cy.removeClickLayer();

    text.forEach(char => {
      cy.get(`[data-cy=character-button-${char}]`).click();
    });
    cy.get('[data-cy=text-span]').should('contain', 'Kopf');
  });

  it('5. Should allow the text maxInputLength length', () => {
    let testData: UnitDefinition;
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const writeParams = testData.interactionParameters as InteractionWriteParams;
      const maxInputLength = writeParams.maxInputLength;

      // Create an array of maxInputLength letters
      const letters = Array.from({ length: maxInputLength }, () => {
        const code = 97 + Math.floor(Math.random() * 26); // a-z
        return String.fromCharCode(code);
      });

      // Remove click layer
      cy.removeClickLayer();

      letters.forEach(letter => {
        cy.get(`[data-cy=character-button-${letter}]`).click();
      });

      // Check if the text is displayed correctly
      cy.get('[data-cy=text-span]')
        .invoke('text')
        .then(text => {
          expect(text.length).to.equal(maxInputLength);
        });

      // Check if I can type more characters
      cy.get('[data-cy=character-button-k]').should('be.disabled');
    });
  });

  it('6. Should add a backspace key if addBackspaceKey param is true', () => {
    let testData: UnitDefinition;
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const writeParams = testData.interactionParameters as InteractionWriteParams;
      const addBackspaceKey = writeParams.addBackspaceKey;

      if (addBackspaceKey) {
        cy.get('[data-cy=backspace-button]').should('exist');
        cy.log('Backspace button exists');
      }
    });
  });

  it('7. Should add äöü if addUmlautKeys param is true', () => {
    let testData: UnitDefinition;
    const umlautKeys = ['ä', 'ö', 'ü'];
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const writeParams = testData.interactionParameters as InteractionWriteParams;
      const addUmlautKeys = writeParams.addUmlautKeys;

      if (addUmlautKeys) {
        umlautKeys.forEach(key => {
          cy.get(`[data-cy=grapheme-button-${key}]`).should('exist');
          cy.log(`${key} grapheme key exists`);
        });
      }
    });
  });

  it('8. Should add the buttons inside keysToAdd param', () => {
    let testData: UnitDefinition;

    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const writeParams = testData.interactionParameters as InteractionWriteParams;
      const extraKeyboardKeys = writeParams.keysToAdd;

      if (extraKeyboardKeys.length > 0) {
        extraKeyboardKeys.forEach((key:string) => {
          cy.get(`[data-cy=keyboard-button-${key}]`).should('exist');
          cy.log(`${key} extra keyboard key exists`);
        });
      }
    });
  });

  // Import and run shared tests for the WRITE interaction type
  testContinueButtonFeatures(subject, interactionType);
  testMainAudioFeatures(subject, interactionType, defaultTestFile);
  testRibbonBars(subject, interactionType);
});
