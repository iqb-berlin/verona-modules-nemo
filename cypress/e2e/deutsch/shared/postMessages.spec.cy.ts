export function testPostMessagesCommunication(subject: string, interactionType: string, configFile: string){

  describe('Post Messages', () => {
    it('1. Should communicate with the parent via postMessages if the Player is in in iframe', () => {
    // Set up test data
      cy.setupTestDataWithPostMessageMock(subject, configFile, interactionType);

      // Wait until the component is rendered
      cy.wait(500);

      // Parent responds with start command
      cy.get('@unitJson').then(wrappedValue => {
        cy.sendMessageFromParent({
          type: 'vopStartCommand',
          sessionId: 'test-session-123',
          unitDefinition: wrappedValue as unknown as string
        }, '*');
      });

      // Wait a bit for the message to be processed
      cy.wait(500);

      // Then check the messages
      cy.get('@incomingMessages').should('have.length.greaterThan', 0);
      cy.get('@outgoingMessages').should('have.length.greaterThan', 0);
    });
  });
}
