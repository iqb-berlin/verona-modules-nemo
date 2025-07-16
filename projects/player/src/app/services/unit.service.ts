import { Injectable, signal } from '@angular/core';
import { ContinueButtonEnum, InteractionEnum } from '../models/unit-definition';

@Injectable({
  providedIn: 'root'
})

export class UnitService {
  mainAudio = signal('');
  mainText = signal('');
  backgroundColor = signal('#FFF');
  continueButton = signal<ContinueButtonEnum>('hide');
  interaction = signal<InteractionEnum>('buttons');
  parameters = signal<unknown>({});

  reset() {
    this.mainAudio.set('');
    this.mainText.set('');
    this.backgroundColor.set('#FFF');
    this.continueButton.set('hide');
    this.interaction.set('buttons');
    this.parameters.set({});
  }

  setNewData(unitDefinition: unknown) {
    this.reset();
    if (unitDefinition['main-audio']) this.mainAudio.set(unitDefinition['main-audio']);
    if (unitDefinition['main-text']) this.mainText.set(unitDefinition['main-text']);
    const pattern = /^#([a-f0-9]{3}|[a-f0-9]{6})$/i;
    if (unitDefinition['background-color'] && pattern.test(unitDefinition['background-color'])) {
      this.backgroundColor.set(unitDefinition['background-color']);
    }
    if (unitDefinition['continue-button']) {
      this.continueButton.set(unitDefinition['continue-button']);
    } else {
      this.continueButton.set('show');
    }
    if (unitDefinition['interaction']) this.interaction.set(unitDefinition['interaction']);
    if (unitDefinition['parameters']) this.parameters.set(unitDefinition['parameters']);
    console.log(this.parameters());
  }
}
