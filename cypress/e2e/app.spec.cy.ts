describe('App component', () => {
  const subject = 'deutsch';
  const configFile = 'buttons_test.json';
  const interactionType = 'buttons';

  type MockMessage = {
    data: {
      type: string;
      unitState?: {
        dataParts: {
          responses: string;
        };
        responseProgress: string;
      };
    },
    origin: string
  };

  beforeEach(() => {
    cy.setupTestDataWithPostMessageMock(subject, configFile, interactionType);
  });

  it('1. Should send vopReadyNotification on initialization from child', () => {
    cy.get('@outgoingMessages').then(messages => {
      const outgoingArr = messages as unknown as MockMessage[];
      expect(outgoingArr.length, 'at least one outgoing message').to.be.greaterThan(0);
      const firstMessage = outgoingArr[0] ?? (() => { throw new Error('No messages found'); })();
      expect(firstMessage.data.type).to.equal('vopReadyNotification');
    });
  });

  it('2. Should respond to the child with vopStartCommand, UI is rendered and state is DISPLAYED', () => {
    // Respond to the child with vopStartCommand (Parent -> child)
    cy.get('@unitJson').then(unitJson => {
      cy.sendMessageFromParent({
        type: 'vopStartCommand',
        sessionId: 'test-session-123',
        unitDefinition: unitJson as unknown as string
      }, '*');
    });

    // Check if the UI is rendered
    cy.get('[data-cy=buttons-container]').should('exist');

    cy.get('@incomingMessages').then(msgs => {
      const incomingArr = msgs as unknown as MockMessage[];
      expect(incomingArr.length, 'at least one incoming message').to.be.greaterThan(0);
      const msgFromParent = incomingArr[incomingArr.length - 1]!.data;
      expect(msgFromParent.type).to.equal('vopStartCommand');
    });

    // outgoingMessages contains vopStateChangedNotification (child -> parent)
    // Check if the state is DISPLAYED
    cy.get('@outgoingMessages').then(messages => {
      const arr = messages as unknown as MockMessage[];
      const stateChangedMessages = arr.filter(msg => msg.data.type === 'vopStateChangedNotification');
      expect(stateChangedMessages.length).to.be.greaterThan(0);

      const latestMessage = stateChangedMessages[stateChangedMessages.length - 1];
      if (!latestMessage?.data?.unitState) {
        throw new Error('Latest message or unitState is undefined');
      }

      expect(latestMessage.data.unitState.dataParts.responses).to.be.a('string');

      const responses = JSON.parse(latestMessage.data.unitState.dataParts.responses);
      const hasDisplayedStatus = responses.some((response: any) => response.status === 'DISPLAYED');

      expect(hasDisplayedStatus, 'Should have DISPLAYED status').to.be.true;
    });
  });

  it('3. Should send vopStateChangedNotification with VALUE_CHANGED on button click', () => {
    // Setup the app first
    cy.get('@unitJson').then(unitJson => {
      cy.sendMessageFromParent({
        type: 'vopStartCommand',
        sessionId: 'test-session-123',
        unitDefinition: unitJson as unknown as string
      }, '*');
    });

    cy.get('[data-cy=buttons-container]').should('exist');

    // Remove click layer
    cy.removeClickLayer();

    // Click first button and test VALUE_CHANGED
    cy.clickButtonAtIndexOne();

    cy.get('@outgoingMessages').then(messages => {
      const arr = messages as unknown as MockMessage[];
      const stateMessages = arr.filter(msg => msg.data.type === 'vopStateChangedNotification');

      const latestMessage = stateMessages[stateMessages.length - 1];
      if (!latestMessage?.data?.unitState) {
        throw new Error('Latest message or unitState is undefined');
      }

      expect(latestMessage.data.unitState.dataParts.responses).to.be.a('string');

      const responses = JSON.parse(latestMessage.data.unitState.dataParts.responses);
      const hasValueChanged = responses.some((response: any) => response.status === 'VALUE_CHANGED');

      expect(hasValueChanged, 'Should have VALUE_CHANGED status').to.be.true;
    });
  });

  it.only('Should send vopStateChangedNotification with CODING_COMPLETE when coding scheme exists', () => {
    // The example json has variableInfo with coding schemes
    cy.get('@unitJson').then(unitJson => {
      cy.sendMessageFromParent({
        type: 'vopStartCommand',
        sessionId: 'test-session-123',
        unitDefinition: unitJson as unknown as string
      }, '*');
    });

    cy.get('[data-cy=buttons-container]').should('exist');

    // Remove click layer
    cy.removeClickLayer();

    // Click on the correct button!


    // cy.get('@outgoingMessages').then(messages => {
    //   const arr = messages as unknown as MockMessage[];
    //   const stateMessages = arr.filter(msg => msg.data.type === 'vopStateChangedNotification');
    //
    //   const latestMessage = stateMessages[stateMessages.length - 1];
    //   if (!latestMessage?.data?.unitState) {
    //     throw new Error('Latest message or unitState is undefined');
    //   }
    //
    //   const responses = JSON.parse(latestMessage.data.unitState.dataParts.responses);
    //   const hasCodingComplete = responses.some((response: any) => response.status === 'CODING_COMPLETE');
    //
    //   expect(hasCodingComplete, 'Should have CODING_COMPLETE status').to.be.true;
    // });
  });
});
