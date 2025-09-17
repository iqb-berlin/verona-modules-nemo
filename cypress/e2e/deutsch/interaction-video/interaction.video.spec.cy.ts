import {
  InteractionVideoParams,
  UnitDefinition
} from '../../../../projects/player/src/app/models/unit-definition';
//import { testContinueButtonFeatures } from '../shared/continue-button.spec.cy';

describe('VIDEO Interaction E2E Tests', () => {
  const subject = 'deutsch';
  const interactionType = 'video';
  const defaultTestFile = 'video_test';

  beforeEach(() => {
    cy.setupTestData(subject, defaultTestFile, interactionType);
  });

  const assertCheckIfVideoElementVisible = () => {
    // Click on the play button to remove it on top of the video element
    cy.get('[data-cy="video-play-button"]').click();

    // Check if a video element is visible
    cy.get('[data-cy="video-player"]').should('exist').and('be.visible');
  };

  const assertPlayVideoFaster = () => {
    // Play it faster for the test purposes
    cy.get('[data-cy="video-player"]').then($video => {
      const videoElement = $video[0] as HTMLVideoElement;
      // Skip to 0.1 seconds before the end
      videoElement.currentTime = videoElement.duration - 0.1;
    });
  };

  it('1. Should display the video element', () => {
    assertCheckIfVideoElementVisible();

    // Check if there is a source element with a valid src attribute
    cy.get('[data-cy="video-player-source"]').should('exist').and('have.attr', 'src');
  });

  it('2. Should start playing when clicked on the play button', () => {
    // Play the video
    cy.get('[data-cy="video-play-button"]').click();
    // There should be a playing class on the video wrapper
    cy.get('[data-cy="video-wrapper"]').should($el => {
      expect($el).to.have.class('playing');
    });
  });

  it('3a. Should display the image element as a placeholder before end after, when there is imageSource', () => {
    cy.get('[data-cy="video-player"]')
      .should('have.attr', 'poster')
      .and('not.be.empty');

    // Play the video
    cy.get('[data-cy="video-play-button"]').click();

    assertPlayVideoFaster();

    // Check if ended class exists on the video wrapper
    cy.get('[data-cy="video-wrapper"]').should($el => {
      expect($el).to.have.class('ended');
    });

    // Check if poster is visible again
    cy.get('[data-cy="video-player"]').should($video => {
      const videoElement = $video[0] as HTMLVideoElement;
      expect(videoElement.currentTime).to.equal(0);
    });
  });

  it('3b. Should not display the image element when there is no imageSource', () => {
    let testData: UnitDefinition;
    // Set up test data
    cy.setupTestData(subject, 'video_without_imageSource_test', interactionType);
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const videoParams = testData.interactionParameters as InteractionVideoParams;

      const imageSource = videoParams.imageSource;

      if (!imageSource) {
        assertCheckIfVideoElementVisible();

        assertPlayVideoFaster();

        // Verify no poster attribute
        cy.get('[data-cy="video-player"]').invoke('attr', 'poster').should('be.empty');
      }
    });
  });

  it('4a. Should display text when there is text parameter', () => {
    cy.get('[data-cy="text-wrapper"]')
      .should('exist')
      .and('be.visible');
  });

  it('4b. Should not display text when there is no text parameter', () => {
    let testData: UnitDefinition;
    // Set up test data
    cy.setupTestData(subject, 'video_without_text_test', interactionType);
    cy.get('@testData').then(data => {
      testData = data as unknown as UnitDefinition;

      const videoParams = testData.interactionParameters as InteractionVideoParams;

      const textParam = videoParams.text;

      if (!textParam) {
        cy.get('[data-cy="text-wrapper"]').should('not.exist');
      }
    });
  });

  // Import and run shared tests for buttons interaction
  //testContinueButtonFeatures(subject, interactionType);
});
