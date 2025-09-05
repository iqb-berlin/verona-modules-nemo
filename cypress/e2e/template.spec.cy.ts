// describe('Checkbox element', { testIsolation: false }, () => {
//   context('player', () => {
//     before('opens a player and load a unit' +
//       '', () => {
//       cy.openPlayer();
//       cy.loadUnit('unitdata/write/write_default');
//     });
//
//     it('clicks at the ear button', () => {
//       cy.get('.layer').click();
//       // write a test that checks that the sound is played
//     });
//
//     it('checks that the continue button is not active', () => {
//       cy.get('stars-continue-button').should('not.exist');
//     });
//
//     it('types the word Kopf, and checks that the text display contains the word', () => {
//       cy.get('[aria-label="K"]').click();
//       cy.get('[aria-label="o"]').click();
//       cy.get('[aria-label="p"]').click();
//       cy.get('[aria-label="f"]').click();
//
//       cy.get('.text-display').should('contain', 'Kopf');
//     });
//
//     it('checks that the continue button is now active', () => {
//       cy.get('stars-continue-button').should('exist');
//     });
//   });
// });
