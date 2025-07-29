import {
  Component, inject, input, OnChanges, OnDestroy, OnInit
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { WriteParams } from '../../models/unit-definition';
import { ResponsesService } from '../../services/responses.service';


@Component({
  selector: 'stars-interaction-write',
  templateUrl: 'write.component.html',
  styleUrls: ['write.component.scss']
})

export class InteractionWriteComponent extends InteractionComponentDirective implements OnInit, OnDestroy, OnChanges {
  parameters = input<WriteParams>();
  isDisabled: boolean = false;
  responsesService = inject(ResponsesService);

  currentText: string = '';
  // @ts-ignore
  characterList = [ ...'abcdefghijklmnopqrstuvwxyz' ];
  // @ts-ignore
  umlautListChars = [...'äöü'];
  graphemeList = [ 'ch', 'sch', 'ng', 'ei', 'au', 'eu', 'le', 'pf', 'chs' ];


  ngOnChanges() {
    this.currentText = '';
    this.isDisabled = false;
  }

  ngOnInit() {
    console.log(this.parameters());
    if (this.parameters().keysToAdd) this.graphemeList = this.parameters().keysToAdd;
  }

  ngOnDestroy(): void {
    console.log(this.parameters());
    console.log('WriteComponent ngOnDestroy');
  }

  capitalize(s: string): string {
    return String(s[0].toUpperCase() + s.slice(1));
  }

  addChar(button: string) {
    if (this.parameters().maxInputLength !== null &&
      this.currentText.length >= this.parameters().maxInputLength) {
      return;
    }

    const charToAdd = this.currentText.length === 0 ? this.capitalize(button) : button;
    this.currentText += charToAdd;

    this.isDisabled = this.parameters().maxInputLength !== null &&
        this.currentText.length >= this.parameters().maxInputLength;

    this.valueChanged();
  }

  deleteChar() {
    if (this.currentText.length > 0) {
      this.currentText = this.currentText.slice(0, -1);
      this.isDisabled = this.parameters().maxInputLength !== null &&
        this.currentText.length >= this.parameters().maxInputLength;
      this.valueChanged();
    }
  }

  private valueChanged(): void {
    const id = this.parameters().variableId || 'INTERACTION_WRITE';

    const response: Response = {
      id: id,
      status: 'VALUE_CHANGED',
      value: this.currentText
    };

    this.responsesService.newResponses([response]);
    this.responses.emit([response]);
  }
}
