describe('Checkbox element', { testIsolation: false }, () => {
  context('player', () => {
    before('opens a player and load a unit' +
      '', () => {
      cy.openPlayer();
      cy.loadUnit('unitdata/write/write_default');
    });

    it('clicks at the ear button', () => {
      cy.get('.layer').click();
    });

    it('types the word Kopf', () => {
      cy.get('[aria-label="K"]').click();
      cy.get('[aria-label="o"]').click();
      cy.get('[aria-label="p"]').click();
      cy.get('[aria-label="f"]').click();
    });

    it('checks that the text dispklay contains the word Kopf', () => {
      cy.get('.text-display').should('contain', 'Kopf');
    });
  });
});
