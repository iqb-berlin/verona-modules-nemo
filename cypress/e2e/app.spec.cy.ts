import { VopMessage } from '../../projects/player/src/app/models/verona';

describe('App component', () => {
  const subject = 'deutsch';
  const configFile = 'buttons_test.json';
  const interactionType = 'buttons';

  it('1. Should communicate via postMessages when the app is in iframe', () => {
    cy.setupTestDataWithPostMessageMock(subject, configFile, interactionType);

    type MockMessage = { data: VopMessage; origin: string };

    // Wait until child sends ready (child -> parent)
    cy.get('@outgoingMessages').then(messages => {
      const outgoingArr = messages as unknown as MockMessage[];
      expect(outgoingArr.length, 'at least one outgoing message').to.be.greaterThan(0);

      const msgFromChild = outgoingArr[0];
      expect(msgFromChild?.data?.type).to.equal('vopReadyNotification');
    });

    // Parent responds with start (parent -> child)
    cy.get('@unitJson').then(unitJson => {
      cy.sendMessageFromParent({
        type: 'vopStartCommand',
        sessionId: 'test-session-123',
        unitDefinition: unitJson as unknown as string
      }, '*');
    });

    // Wait until parent sends ready (parent -> child)
    cy.wait(500);
    cy.get('@incomingMessages').then(msgs => {
      const incomingArr = msgs as unknown as MockMessage[];
      expect(incomingArr.length, 'at least one incoming message').to.be.greaterThan(0);
      const msgFromParent = incomingArr[incomingArr.length - 1]!.data;
      expect(msgFromParent.type).to.equal('vopStartCommand');
    });

    // And the UI should be up
    cy.get(`[data-cy=${interactionType}-container]`).should('exist');
  });
});
