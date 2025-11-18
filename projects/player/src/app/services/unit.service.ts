import { Injectable, computed, signal } from '@angular/core';

import {
  ContinueButtonEnum,
  InteractionEnum,
  MainAudio, OpeningImageParams, UnitDefinition
} from '../models/unit-definition';

@Injectable({
  providedIn: 'root'
})

export class UnitService {
  mainAudio = signal<MainAudio | null>(null);
  private audioOverride = signal<MainAudio | null>(null);
  backgroundColor = signal('#EEE');
  continueButton = signal<ContinueButtonEnum>('ALWAYS');
  interaction = signal<InteractionEnum | null>(null);
  parameters = signal<unknown>({});
  hasInteraction = signal(false);
  ribbonBars = signal<boolean>(false);
  disableInteractionUntilComplete = signal(false);
  openingImageParams = signal<OpeningImageParams | null>(null);
  /** Whether the opening flow is active (audio started and image shown) or not. */
  openingFlowActive = signal(false);
  /** Whether the opening image should be shown presentationDurationMS milliseconds or not. */
  showOpeningImage = signal(false);
  /** Used to decide currentPlayerId: either mainAudio or openingAudio. */
  openingAudioActive = signal(false);
  /** Used to hide any audio UI while the opening image is being shown */
  effectiveMainAudio = computed<MainAudio | null>(() => {
    if (this.showOpeningImage()) return null;
    return this.audioOverride() ?? this.mainAudio();
  });

  currentPlayerId = computed<string>(() => (this.openingAudioActive() ? 'openingAudio' : 'mainAudio'));

  reset() {
    this.mainAudio.set(null);
    this.audioOverride.set(null);
    this.backgroundColor.set('#EEE');
    this.continueButton.set('ALWAYS');
    this.interaction.set('NONE');
    this.parameters.set({});
    this.hasInteraction.set(false);
    this.ribbonBars.set(false);
    this.disableInteractionUntilComplete.set(false);
    this.openingImageParams.set(null);
    this.openingFlowActive.set(false);
    this.showOpeningImage.set(false);
    this.openingAudioActive.set(false);
  }

  setNewData(unitDefinition: unknown) {
    this.reset();
    const def = unitDefinition as UnitDefinition;
    if (def.mainAudio) this.mainAudio.set(def.mainAudio);
    const pattern = /^#([a-f0-9]{3}|[a-f0-9]{6})$/i;
    if (def.backgroundColor && pattern.test(def.backgroundColor)) {
      this.backgroundColor.set(def.backgroundColor);
    }
    if (def.continueButtonShow) {
      this.continueButton.set(def.continueButtonShow);
    }
    if (def.interactionType) this.interaction.set(def.interactionType);
    if (def.interactionParameters) this.parameters.set(def.interactionParameters);
    if (def.ribbonBars) this.ribbonBars.set(def.ribbonBars);
    if (def.mainAudio?.disableInteractionUntilComplete) {
      this.disableInteractionUntilComplete.set(def.mainAudio.disableInteractionUntilComplete);
    }
    if (def.openingImage && def.openingImage.imageSource) {
      this.openingImageParams.set(def.openingImage);
      this.openingFlowActive.set(true);
      this.showOpeningImage.set(false);
    }
  }

  // Called by OpeningImageComponent to begin playing the opening audio immediately
  startOpeningAudio() {
    // Ensure we are in opening flow, interactions hidden
    this.openingFlowActive.set(true);
    this.showOpeningImage.set(false);
    const openingImageParameters = this.openingImageParams();
    if (openingImageParameters?.audioSource) {
      // Use the main audio player UI but with a temporary audio source and separate playerId
      this.audioOverride.set({
        audioSource: openingImageParameters.audioSource,
        firstClickLayer: false,
        animateButton: false,
        maxPlay: 1,
        disableInteractionUntilComplete: false
      });
      this.openingAudioActive.set(true);
    } else {
      // If no opening audio, directly show the image for its duration then finish
      this.showImageThenFinish();
    }
  }

  // Called by MainAudioComponent when an audio finished; used to clear override
  audioEnded(playerId: string) {
    if (playerId === 'openingAudio') {
      // Clear override and return to unit's main audio
      this.openingAudioActive.set(false);
      this.audioOverride.set(null);
      // After intro audio ends, show image for presentation duration, then end flow
      this.showImageThenFinish();
    }
  }

  private showImageThenFinish() {
    const openingImageParameters = this.openingImageParams();
    const duration = Number.isFinite(openingImageParameters?.presentationDurationMS as number) &&
    (openingImageParameters?.presentationDurationMS as number) > 0 ?
      (openingImageParameters?.presentationDurationMS as number) : 0;
    this.showOpeningImage.set(true);
    setTimeout(() => {
      this.showOpeningImage.set(false);
      this.openingFlowActive.set(false);
    }, duration);
  }
}
