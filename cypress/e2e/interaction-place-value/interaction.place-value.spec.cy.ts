import { testMainAudioFeatures } from '../shared/main-audio.spec.cy';
import { testContinueButtonFeatures } from '../shared/continue-button.spec.cy';
import { testRibbonBars } from '../shared/ribbon-bar.spec.cy';
import {
  InteractionPlaceValueParams,
  UnitDefinition
} from '../../../projects/player/src/app/models/unit-definition';

describe('PLACE_VALUE Interaction E2E Tests', () => {
  const interactionType = 'place_value';
  const defaultTestFile = 'placeValue_test';

  const setupAndAssert = (file: string) => {
    cy.setupTestData(file, interactionType);
    cy.get('[data-cy="interaction-place-value"]').should('exist');
  };

  it('renders initial state correctly', () => {
    setupAndAssert(`${defaultTestFile}.json`);

    cy.get('@testData').then(data => {
      const testData = data as unknown as UnitDefinition;
      const params = testData.interactionParameters as InteractionPlaceValueParams;
      const value = params.value;
      const maxNumberOfOnes = params.maxNumberOfOnes;
      const maxNumberOfTens = params.maxNumberOfTens;
      cy.get('[data-cy="interaction-place-value"]').within(() => {
        cy.get('[data-cy="place-value"]').should('contain', value);
        cy.get('[data-cy="icons-upper-panel"]').should('exist');
        cy.get('[data-cy="ones-wrapper"]').should('exist');
        cy.get('[data-cy="tens-wrapper"]').should('exist');

        // Check the number of ones
        // maxNumberOfOnes+1 because one icon is always stays visible in the container even after all items are moved up
        cy.get('[data-cy="icon-item-ones"]').should('have.length', (maxNumberOfOnes ?? 0) + 1);
        // Check the number of tens
        // maxNumberOfTens+1 because one icon is always stays visible in the container even after all items are moved up
        cy.get('[data-cy="icon-item-tens"]').should('have.length', (maxNumberOfTens ?? 0) + 1);
      });
    });
  });

  it('moves icons to upper panel when clicked', () => {
    setupAndAssert(`${defaultTestFile}.json`);

    // Click a "one" icon
    cy.get('[data-cy="icon-item-ones"]').first().click();
    cy.get('[data-cy="icon-item-ones"]').first().should('have.class', 'moved');

    // Click another "one" icon
    cy.get('[data-cy="icon-item-ones"]').eq(1).click();
    cy.get('[data-cy="icon-item-ones"]').eq(1).should('have.class', 'moved');

    // Click a "ten" icon
    cy.get('[data-cy="icon-item-tens"]').first().click();
    cy.get('[data-cy="icon-item-tens"]').first().should('have.class', 'moved');

    // Click the moved icons again to move them back
    cy.get('.icon-item.ones.moved').first().click();
    cy.get('.icon-item.ones').first().should('not.have.class', 'moved');

    cy.get('.icon-item.tens.moved').first().click();
    cy.get('[data-cy="icon-item-tens"]').first().should('not.have.class', 'moved');
  });

  describe('Shared Features', () => {
    testMainAudioFeatures(interactionType, defaultTestFile);
    testContinueButtonFeatures(defaultTestFile);
    testRibbonBars(interactionType);
  });
});
