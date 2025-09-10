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
import { VopStartCommand } from './types';

Cypress.Commands.add('loadUnit', (filename: string) => {
  cy.fixture(filename).as('unit').then(unit => {
    cy.window().then(window => {
      const postMessage = {
        type: 'vopStartCommand',
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

Cypress.Commands.add('mockParentWindow', () => {
  cy.window().then(win => {
    const messageLog: Array<{
      data: VopStartCommand;
      origin: string;
    }> = [];

    const mockParent = {
      postMessage: (data: VopStartCommand, origin: string) => {
        messageLog.push({ data, origin });
      }
    };

    Object.defineProperty(win, 'parent', {
      value: mockParent,
      writable: true
    });

    cy.wrap(messageLog).as('parentMessageLog');
  });
});

Cypress.Commands.add('sendMessageFromParent', (data, origin = '*') => {
  cy.window().then(win => {
    cy.log('Sending message from parent', JSON.stringify(data));

    // Console logging (appears in browser dev tools)
    console.log('🟡 Sending message from parent to child:', { data, origin });
    win.postMessage(data, origin);
  });
});
