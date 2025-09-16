describe('App component', () => {
  const subject = 'deutsch';
  const configFile = 'buttons_test.json';
  const interactionType = 'buttons';

  it('1. Should communicate via postMessages when the app is in iframe', () => {
    cy.setupTestDataWithPostMessageMock(subject, configFile, interactionType);

    type MockMessage = { data: { type: string }, origin: string };

    // Wait until child sends ready (child -> parent)
    cy.get('@outgoingMessages').then(messages => {
      const outgoingArr = messages as unknown as MockMessage[];
      expect(outgoingArr.length, 'at least one outgoing message').to.be.greaterThan(0);
      const firstMessage = outgoingArr[0] ?? (() => { throw new Error('No messages found'); })();
      const { type } = firstMessage.data;
      expect(type).to.equal('vopReadyNotification');
    });

    // Parent responds with start (parent -> child)
    cy.get('@unitJson').then(unitJson => {
      cy.sendMessageFromParent({
        type: 'vopStartCommand',
        sessionId: 'test-session-123',
        unitDefinition: unitJson as unknown as string
      }, '*');
    });

    // And the UI should be up
    cy.get('[data-cy=buttons-container]').should('exist');

    // Send state changed notification (child -> parent)
    cy.window().then((win: any) => {
      if (win.testStars?.sendStateChanged()) {
        win.testStars.sendStateChanged({
          unitStateDataType: 'iqb-standard@1.1',
          dataParts: { responses: '[]' }, // String representation of responses array
          responseProgress: 'none'
        });
      }
    });

    cy.get('@incomingMessages').then(msgs => {
      const incomingArr = msgs as unknown as MockMessage[];
      expect(incomingArr.length, 'at least one incoming message').to.be.greaterThan(0);
      const msgFromParent = incomingArr[incomingArr.length - 1]!.data;
      expect(msgFromParent.type).to.equal('vopStartCommand');
    });

    // outgoingMessages contains vopStateChangedNotification (child -> parent)
    cy.get('@outgoingMessages').then(messages => {
      const arr = messages as unknown as MockMessage[];
      const stateChangedMessages = arr.filter(msg => msg.data.type === 'vopStateChangedNotification'
      );
      expect(stateChangedMessages.length).to.be.greaterThan(0);
    });
  });
});
