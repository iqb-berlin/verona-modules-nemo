/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

Cypress.Commands.add('loadUnit', (filename: string) => {
  cy.fixture(filename).as('unit').then(unit => {
    cy.window().then(window => {
      const postMessage = {
        type: 'vopStartCommand',
        sessionId: 'cypress-test-session',
        unitDefinition: JSON.stringify(unit)
      };
      window.postMessage(postMessage, '*');
    });
  });
});

Cypress.Commands.add('setupTestData', (subject: string, configFile: string, interactionType: string) => {
  const fullPath = `${subject}/interaction-${interactionType}/${configFile}`;
  cy.fixture(fullPath).as('testData');
  cy.visit('http://localhost:4200');
  cy.loadUnit(fullPath);
});

Cypress.Commands.add('setupTestDataWithPostMessageMock', (subject: string, configFile: string, interactionType: string) => {
  // 1. FIRST load fixture data
  const fullPath = `${subject}/interaction-${interactionType}/${configFile}`;
  return cy.fixture(fullPath).then(unit => {
    const unitJson = JSON.stringify(unit);
    cy.wrap(unit, { log: false }).as('testData');
    cy.wrap(unitJson, { log: false }).as('unitJson');

    // 2. THEN visit with mock setup
    cy.visit('http://localhost:4200', {
      onBeforeLoad(win) {
        // eslint-disable-next-line no-underscore-dangle
        (win as any).__E2E__ = true;
        // Capture messages from child to parent (outgoing)
        const outgoingMessages: Array<{
          data: any;
          origin: string;
        }> = [];

        const mockParent = {
          postMessage: (data: any, origin: string) => {
            console.log('Child → Parent message:', data);
            outgoingMessages.push({
              data,
              origin
            });
          }
        };

        Object.defineProperty(win, 'parent', {
          value: mockParent,
          configurable: true
        });

        // Capture messages sent from parent to child (incoming)
        const incomingMessages: Array<{
          data: any;
          origin: string;
        }> = [];

        // Listen for actual MessageEvents - only store vopStartCommand
        win.addEventListener('message', (event: MessageEvent) => {
          console.log('Parent → Child message event:', event.data);
          incomingMessages.push({
            data: event.data,
            origin: event.origin
          });
        }, true);

        // Store on window
        (win as any).incomingMockMessage = incomingMessages;
        (win as any).outgoingMockMessage = outgoingMessages;
      }
    });

    // 3. AFTER visit, expose aliases
    cy.window().then(win => {
      cy.wrap((win as any).incomingMockMessage).as('incomingMessages');
      cy.wrap((win as any).outgoingMockMessage).as('outgoingMessages');
    });
  });
});

Cypress.Commands.add('sendMessageFromParent', (data, origin = '*') => {
  cy.window().then(win => {
    cy.log('Sending message from parent', data);
    win.postMessage(data, origin);
    cy.log('postMessage sent');
  });
});
