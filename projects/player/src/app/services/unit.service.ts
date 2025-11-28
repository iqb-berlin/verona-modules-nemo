import { Injectable, signal } from '@angular/core';

import {
  AudioOptions,
  ContinueButtonEnum,
  FirstAudioOptionsParams,
  InteractionEnum,
  UnitDefinition
} from '../models/unit-definition';

@Injectable({
  providedIn: 'root'
})

export class UnitService {
  firstAudioOptions = signal<FirstAudioOptionsParams | undefined>(undefined);
  mainAudio = signal<AudioOptions | undefined>(undefined);
  backgroundColor = signal('#EEE');
  continueButton = signal<ContinueButtonEnum>('ALWAYS');
  interaction = signal<InteractionEnum | undefined>(undefined);
  parameters = signal<unknown>({});
  hasInteraction = signal(false);
  ribbonBars = signal<boolean>(false);
  disableInteractionUntilComplete = signal(false);

  reset() {
    this.mainAudio.set(undefined);
    this.firstAudioOptions.set(undefined);
    this.backgroundColor.set('#EEE');
    this.continueButton.set('ALWAYS');
    this.interaction.set(undefined);
    this.parameters.set({});
    this.hasInteraction.set(false);
    this.ribbonBars.set(false);
    this.disableInteractionUntilComplete.set(false);
  }

  setNewData(unitDefinition: unknown) {
    this.reset();
    const def = unitDefinition as UnitDefinition;
    const firstAudioOptions: FirstAudioOptionsParams = {};
    this.firstAudioOptions.set(def.firstAudioOptions || firstAudioOptions);
    this.hasInteraction.set(def.interactionType !== undefined || def.interactionParameters !== undefined);
    // add audioId to mainAudio object to be able to use it in audioService.setAudioSrc()
    if (def.mainAudio) this.mainAudio.set({ ...def.mainAudio, audioId: 'mainAudio' } as AudioOptions);
    // Backward compatibility for animateButton and firstClickLayer
    if (this.mainAudio()?.animateButton) {
      if (!this.firstAudioOptions()?.animateButton) {
        this.firstAudioOptions.set({ ...this.firstAudioOptions(), animateButton: this.mainAudio().animateButton });
      }
    }
    if (this.mainAudio()?.firstClickLayer) {
      if (!this.firstAudioOptions()?.firstClickLayer) {
        this.firstAudioOptions.set({ ...this.firstAudioOptions(), firstClickLayer: this.mainAudio().firstClickLayer });
      }
    }
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
  }
}
