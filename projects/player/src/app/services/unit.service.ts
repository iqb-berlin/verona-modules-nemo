import { Injectable, signal } from '@angular/core';

import {
  ContinueButtonEnum,
  InteractionEnum,
  MainAudio, UnitDefinition
} from '../models/unit-definition';

@Injectable({
  providedIn: 'root'
})

export class UnitService {
  mainAudio = signal<MainAudio>(null);
  backgroundColor = signal('#FFF');
  continueButton = signal<ContinueButtonEnum>('ALWAYS');
  interaction = signal<InteractionEnum>('BUTTONS');
  parameters = signal<unknown>({});
  hasInteraction = signal(false);
  ribbonBars = signal<boolean>(false);

  reset() {
    this.mainAudio.set(null);
    this.backgroundColor.set('#FFF');
    this.continueButton.set('ALWAYS');
    this.interaction.set(null);
    this.parameters.set({});
    this.hasInteraction.set(false);
    this.ribbonBars.set(false);
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
  }
}
