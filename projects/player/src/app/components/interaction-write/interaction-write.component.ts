import { Component, effect, OnInit } from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionWriteParams } from '../../models/unit-definition';

@Component({
  selector: 'stars-interaction-write',
  templateUrl: 'interaction-write.component.html',
  styleUrls: ['interaction-write.component.scss']
})

export class InteractionWriteComponent extends InteractionComponentDirective implements OnInit {
  localParameters: InteractionWriteParams;
  isDisabled: boolean = false;
  currentText: string = '';
  characterList = [...'abcdefghijklmnopqrstuvwxyz'];
  umlautListChars = [...'äöü'];

  constructor() {
    super();

    effect(() => {
      const parameters = this.parameters() as InteractionWriteParams;

      this.localParameters = this.createDefaultParameters();

      if (parameters) {
        this.localParameters.addBackspaceKey = parameters.addBackspaceKey || true;
        this.localParameters.addUmlautKeys = parameters.addUmlautKeys || true;
        this.localParameters.keysToAdd = parameters.keysToAdd || [];
        this.localParameters.variableId = parameters.variableId || 'WRITE';
        this.localParameters.maxInputLength = parameters.maxInputLength || 10;
        this.localParameters.imageSource = parameters.imageSource || null;
        this.localParameters.text = parameters.text || null;
      }

      this.currentText = '';
    });
  }

  ngOnInit() {
    this.responses.emit([{
      // @ts-expect-error access parameter of unknown
      id: this.parameters().variableId || 'WRITE',
      status: 'DISPLAYED',
      value: ''
    }]);
  }

  // eslint-disable-next-line class-methods-use-this
  capitalize(s: string): string {
    return String(s[0].toUpperCase() + s.slice(1));
  }

  addChar(button: string) {
    if (this.localParameters.maxInputLength !== null &&
      this.currentText.length >= this.localParameters.maxInputLength) {
      return;
    }

    const charToAdd = this.currentText.length === 0 ? this.capitalize(button) : button;
    this.currentText += charToAdd;

    this.isDisabled = this.localParameters.maxInputLength !== null &&
        this.currentText.length >= this.localParameters.maxInputLength;

    this.valueChanged();
  }

  deleteChar() {
    if (this.currentText.length > 0) {
      this.currentText = this.currentText.slice(0, -1);
      this.isDisabled = this.localParameters.maxInputLength !== null &&
        this.currentText.length >= this.localParameters.maxInputLength;
      this.valueChanged();
    }
  }

  private valueChanged() {
    const response: Response = {
      id: this.localParameters.variableId,
      status: 'VALUE_CHANGED',
      value: this.currentText
    };

    this.responses.emit([response]);
  }

  // eslint-disable-next-line class-methods-use-this
  private createDefaultParameters(): InteractionWriteParams {
    return {
      variableId: 'WRITE',
      imageSource: null,
      text: null,
      addBackspaceKey: true,
      addUmlautKeys: true,
      keysToAdd: [],
      maxInputLength: 10
    };
  }
}
