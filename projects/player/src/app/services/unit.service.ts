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

  reset() {
    this.mainAudio.set(null);
    this.backgroundColor.set('#FFF');
    this.continueButton.set('ALWAYS');
    this.interaction.set('BUTTONS');
    this.parameters.set({});
    this.hasInteraction.set(false);
  }

  setNewData(unitDefinition: UnitDefinition) {
    this.reset();
    if (unitDefinition.mainAudio) this.mainAudio.set(unitDefinition.mainAudio);
    const pattern = /^#([a-f0-9]{3}|[a-f0-9]{6})$/i;
    if (unitDefinition.backgroundColor && pattern.test(unitDefinition.backgroundColor)) {
      this.backgroundColor.set(unitDefinition.backgroundColor);
    }
    if (unitDefinition.continueButtonShow) {
      this.continueButton.set(unitDefinition.continueButtonShow);
    }
    if (unitDefinition.interactionType) this.interaction.set(unitDefinition.interactionType);
    if (unitDefinition.interactionParameters) this.parameters.set(unitDefinition.interactionParameters);
    console.log(this.mainAudio());
    console.log(this.parameters());
  }
}
