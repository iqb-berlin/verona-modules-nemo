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
import { VopStartCommand } from '../../projects/player/src/app/models/verona';

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
  const fullPath = `${subject}/interaction-${interactionType}/${configFile}`;

  cy.fixture(fullPath).then(unit => {
    const unitJson = JSON.stringify(unit);
    cy.wrap(unit, { log: false }).as('testData');
    cy.wrap(unitJson, { log: false }).as('unitJson');
  });

  // Do the mock setup and visit localhost:4200
  cy.visit('http://localhost:4200', {
    onBeforeLoad(win) {
      // Capture messages from child to parent (outgoing)
      const outgoingMessages: Array<{
        data: any;
        origin: string;
        timestamp: number;
      }> = [];

      const mockParent = {
        postMessage: (data: any, origin: string) => {
          console.log('Child → Parent message:', data);
          outgoingMessages.push({
            data,
            origin,
            timestamp: Date.now()
          });
        }
      };

      Object.defineProperty(win, 'parent', {
        value: mockParent,
        configurable: true
      });

      // Capture messages sent from parent to child (incoming)
      const incomingMessages: Array<{
        data: VopStartCommand;
        origin: string;
        timestamp: number;
      }> = [];

      // Listen for actual MessageEvents
      win.addEventListener('message', (event: MessageEvent) => {
        console.log('Parent → Child message event:', event.data);
        incomingMessages.push({
          data: event.data,
          origin: event.origin,
          timestamp: Date.now()
        });
      }, true);

      // Store on window
      (win as any).incomingMockMessage = incomingMessages;
      (win as any).outgoingMockMessage = outgoingMessages;
    }
  });

  // After the page is loaded, expose aliases for assertions
  cy.window().then(win => {
    cy.wrap((win as any).incomingMockMessage).as('incomingMessages');
    cy.wrap((win as any).outgoingMockMessage).as('outgoingMessages');
  });
});

Cypress.Commands.add('sendMessageFromParent', (data, origin = '*') => {
  cy.window().then(win => {
    cy.log('Sending message from parent', data);
    win.postMessage(data, origin);
    cy.log('postMessage sent');
  });
});
