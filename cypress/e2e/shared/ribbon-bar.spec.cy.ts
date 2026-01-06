import { UnitDefinition } from '../../../projects/player/src/app/models/unit-definition';

export function testRibbonBars(interactionType: string) {
  describe(`Ribbon Bars for interactionType - ${interactionType}`, () => {
    const loadDefaultTestFile = () => {
      cy.setupTestData(`${interactionType}_ribbonBars_true_test`, interactionType);
      return cy.get('@testData') as unknown as Cypress.Chainable<UnitDefinition>;
    };

    const loadWhiteBgTestFile = () => {
      cy.setupTestData(`${interactionType}_ribbonBars_true_bg_white_test`, interactionType);
      return cy.get('@testData') as unknown as Cypress.Chainable<UnitDefinition>;
    };

    const checkRibbonBars = (testData: UnitDefinition) => {
      expect(testData.ribbonBars).to.equal(true);
    };

    const removeClickLayerIfApplicable = (type: string) => {
      // Remove the click layer if it's not a FIND_ON_IMAGE or VIDEO interaction type
      if (!['find_on_image', 'video'].includes(type)) {
        cy.removeClickLayer();
      }
    };

    const setupRibbonBarTest = (fileLoader: () => Cypress.Chainable<UnitDefinition>) => fileLoader().then(testData => {
      removeClickLayerIfApplicable(interactionType);
      checkRibbonBars(testData);
      return cy.wrap(testData);
    });

    it('shows ribbon bars component if ribbonBars is true', () => {
      // Load the file
      loadDefaultTestFile().then(testData => {
        // Remove click layer
        removeClickLayerIfApplicable(interactionType);

        // Check if ribbonBars true and the component exists
        checkRibbonBars(testData);

        cy.get('[data-cy="ribbon-bar"]').should('exist');
      });
    });

    it('shows ribbon bar as WHITE if background is NOT white', () => {
      setupRibbonBarTest(loadDefaultTestFile).then(testData => {
        const bgColor = testData.backgroundColor?.toUpperCase() || '';
        const isBgColorWhite = ['#FFF', '#FFFFFF', '#EEE', '#EEEEEE', 'WHITE'].includes(bgColor);

        if (!isBgColorWhite) {
          cy.get('[data-cy="ribbon-bar"]')
            .should('have.css', 'background-image')
            .then(bg => {
              expect(bg).to.contain('repeating-linear-gradient');
              expect(bg).to.contain('rgb(255, 255, 255)'); // white color #FFFFFF
            });
        }
      });
    });

    it('shows ribbon bar as BLUE if background is white', () => {
      setupRibbonBarTest(loadWhiteBgTestFile).then(testData => {
        const bgColor = testData.backgroundColor?.toUpperCase() || '';
        const isBgColorWhite = ['#FFF', '#FFFFFF', '#EEE', '#EEEEEE', 'WHITE'].includes(bgColor);

        if (isBgColorWhite) {
          cy.get('[data-cy="ribbon-bar"]')
            .should('have.css', 'background-image')
            .then(bg => {
              expect(bg).to.contain('repeating-linear-gradient');
              expect(bg).to.contain('rgb(177, 223, 255)'); // sky color #B1DFFF
            });
        }
      });
    });
  });
}
