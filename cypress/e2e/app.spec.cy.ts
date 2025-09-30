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

  /**
  * Helper function to send a message from the parent to the child
  * @param {string} type - The type of message to send
  * @param {string} sessionId - The session ID to send with the message
  * */
  const sendStartCommand = (type: 'vopStartCommand', sessionId: string) => {
    cy.get('@unitJson').then(unitJson => {
      cy.sendMessageFromParent({
        type,
        sessionId,
        unitDefinition: unitJson as unknown as string
      }, '*');
    });
  };

  /**
   * Helper function to check if the latest outgoing message has the specified status
   * @param {string} status - The status to check for
   * * */
  const checkIfResponseStatusDisplayed = (status: string) => {
    cy.get('@outgoingMessages').then(messages => {
      const arr = messages as unknown as MockMessage[];
      const stateMessages = arr.filter(msg => msg.data.type === 'vopStateChangedNotification');

      const latestMessage = stateMessages[stateMessages.length - 1];
      if (!latestMessage?.data?.unitState) {
        throw new Error('Latest message or unitState is undefined');
      }

      expect(latestMessage.data.unitState.dataParts.responses).to.be.a('string');

      const responses = JSON.parse(latestMessage.data.unitState.dataParts.responses);
      const hasValueChanged = responses.some((response: any) => response.status === status);

      expect(hasValueChanged, `Should have ${status} status`).is.true;
    });
  };

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
    sendStartCommand('vopStartCommand', 'test-session-123');

    // Check if the UI is rendered
    cy.get('[data-cy=buttons-container]').should('exist');

    cy.get('@incomingMessages').then(msgs => {
      const incomingArr = msgs as unknown as MockMessage[];
      expect(incomingArr.length, 'at least one incoming message').to.be.greaterThan(0);
      const msgFromParent = incomingArr[incomingArr.length - 1]!.data;
      expect(msgFromParent.type).to.equal('vopStartCommand');
    });

    // outgoingMessages contains vopStateChangedNotification (child -> parent)
    // Check if the status is DISPLAYED
    checkIfResponseStatusDisplayed('DISPLAYED');
  });

  // If the component has a corresponding variableInfo coding scheme in the unit definition,
  // responses status will be CODING_COMPLETE. Otherwise, it will be VALUE_CHANGED.
  it('3. Should send vopStateChangedNotification with VALUE_CHANGED on button click', () => {
    // Setup test data without variableInfo in the json
    cy.setupTestDataWithPostMessageMock(subject, 'buttons_without_variableInfo_test', interactionType);
    // Respond to the child with vopStartCommand (Parent -> child)
    sendStartCommand('vopStartCommand', 'test-session-123');

    cy.get('[data-cy=buttons-container]').should('exist');

    // Remove click layer
    cy.removeClickLayer();

    // Click first button
    cy.clickButtonAtIndexOne();

    // Check if the status is VALUE_CHANGED
    checkIfResponseStatusDisplayed('VALUE_CHANGED');
  });

  it('4. Should send vopStateChangedNotification with CODING_COMPLETE when coding scheme exists', () => {
    // Respond to the child with vopStartCommand (Parent -> child)
    sendStartCommand('vopStartCommand', 'test-session-123');

    cy.get('[data-cy=buttons-container]').should('exist');

    // Remove click layer
    cy.removeClickLayer();

    // Click first button
    cy.clickButtonAtIndexOne();

    // Check if the status is CODING_COMPLETE
    checkIfResponseStatusDisplayed('CODING_COMPLETE');
  });
});
