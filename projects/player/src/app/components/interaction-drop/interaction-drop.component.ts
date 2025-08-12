import {
  Component, signal, effect, OnInit
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionDropParams } from '../../models/unit-definition';
import { StandardButtonComponent } from '../../shared/standard-button/standard-button.component';

@Component({
  selector: 'stars-interaction-drop',
  templateUrl: './interaction-drop.component.html',
  imports: [
    StandardButtonComponent
  ],
  styleUrls: ['./interaction-drop.component.scss']
})

export class InteractionDropComponent extends InteractionComponentDirective implements OnInit {
  localParameters: InteractionDropParams;
  selectedValue = signal<number>(-1);
  // create a signal for handling disabling transition on change
  disabledTransition = signal<boolean>(false);

  constructor() {
    super();

    effect(() => {
      const parameters = this.parameters() as InteractionDropParams;

      this.localParameters = this.createDefaultParameters();

      if (parameters) {
        this.localParameters.options = parameters.options || null;
        this.localParameters.variableId = parameters.variableId || 'DROP';
        this.localParameters.imageSource = parameters.imageSource || null;
        this.localParameters.text = parameters.text || null;
      }

      this.resetSelection();
    });
  }

  ngOnInit() {
    this.responses.emit([{
      // @ts-expect-error access parameter of unknown
      id: this.parameters().variableId || 'DROP',
      status: 'DISPLAYED',
      value: 0
    }]);
  }

  private resetSelection(): void {
    // before resetting, disable transition to move back instantly
    this.disabledTransition.set(true);
    this.selectedValue.set(-1);
    setTimeout(() => {
      this.disabledTransition.set(false);
    }, 500);
  }

  animateStyle(index: number): string {
    if (this.selectedValue() !== index) return '';

    // each button has 200px incl 24px gap/shadow
    // minus half it's size to set target to the center of div
    const offset = ((200 * this.localParameters.options.length) / 2) - 100 - (index * 200);
    return `translate(${offset}px,270px)`;
  }

  onButtonClick(index: number): void {
    /* Toggle selection: if already selected, deselect it
    (this moves the element back to the original position) */
    this.selectedValue.set(this.selectedValue() === index ? -1 : index);

    const response: Response = {
      id: this.localParameters.variableId,
      status: 'VALUE_CHANGED',
      value: this.selectedValue() + 1
    };

    this.responses.emit([response]);
  }

  // eslint-disable-next-line class-methods-use-this
  private createDefaultParameters(): InteractionDropParams {
    return {
      variableId: 'DROP',
      options: null,
      imageSource: null,
      text: null
    };
  }
}
