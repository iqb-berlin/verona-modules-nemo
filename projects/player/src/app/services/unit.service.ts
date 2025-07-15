import { Injectable } from '@angular/core';
import { ContinueButtonEnum, InteractionEnum } from '../models/unit-definition';

@Injectable({
  providedIn: 'root'
})

export class UnitService {
  mainAudio: string = '';
  mainText: string = '';
  backgroundColor: string = '#FFF';
  continueButton: ContinueButtonEnum = 'show';
  interaction: InteractionEnum = 'buttons';
  parameters: unknown = {};

  reset() {
    this.mainAudio = '';
    this.mainText = '';
    this.backgroundColor = '#FFF';
    this.continueButton = 'show';
    this.interaction = 'buttons';
    this.parameters = {};
  }

  setNewData(unitDefinition: unknown) {
    this.reset();
    if (unitDefinition['main-audio']) this.mainAudio = unitDefinition['main-audio'];
    if (unitDefinition['main-text']) this.mainText = unitDefinition['main-text'];
    const pattern = /^#([a-f0-9]{3}|[a-f0-9]{6})$/i;
    if (unitDefinition['background-color'] && pattern.test(unitDefinition['background-color'])) {
      this.backgroundColor = unitDefinition['background-color'];
    }
    if (unitDefinition['continue-button']) this.continueButton = unitDefinition['continue-button'];
    if (unitDefinition['interaction']) this.interaction = unitDefinition['interaction'];
    if (unitDefinition['parameters']) this.parameters = unitDefinition['parameters'];
  }
}
