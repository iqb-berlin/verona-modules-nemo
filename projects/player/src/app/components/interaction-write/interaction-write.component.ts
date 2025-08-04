import { Component, effect } from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionWriteParams } from '../../models/unit-definition';

@Component({
  selector: 'stars-interaction-write',
  templateUrl: 'interaction-write.component.html',
  styleUrls: ['interaction-write.component.scss']
})

export class InteractionWriteComponent extends InteractionComponentDirective {
  localParameters: InteractionWriteParams | null = null;
  isDisabled: boolean = false;
  currentText: string = '';
  characterList = [...'abcdefghijklmnopqrstuvwxyz'];
  umlautListChars = [...'äöü'];
  graphemeList = ['ch', 'sch', 'ng', 'ei', 'au', 'eu', 'le', 'pf', 'chs'];

  constructor() {
    super();

    effect(() => {
      this.localParameters = this.parameters() as InteractionWriteParams;

      if (this.localParameters !== null) {
        this.localParameters.addBackspaceKey = this.localParameters.addBackspaceKey ?
          this.localParameters.addBackspaceKey : true;
        this.localParameters.addUmlautKeys = this.localParameters.addUmlautKeys ?
          this.localParameters.addUmlautKeys : true;
        this.localParameters.keysToAdd = this.localParameters.keysToAdd ?
          this.localParameters.keysToAdd : [];
        this.localParameters.variableId = this.localParameters.variableId ?
          this.localParameters.variableId : 'WRITE';
        this.localParameters.maxInputLength = this.localParameters.maxInputLength ?
          this.localParameters.maxInputLength : 10;
        this.localParameters.imageSource = this.localParameters.imageSource ?
          this.localParameters.imageSource : null;
        this.localParameters.text = this.localParameters.text ?
          this.localParameters.text : null;
      }

      this.currentText = '';
    });
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

  private valueChanged(): void {
    const id = this.localParameters.variableId;

    const response: Response = {
      id: id,
      status: 'VALUE_CHANGED',
      value: this.currentText
    };

    this.responses.emit([response]);
  }
}
