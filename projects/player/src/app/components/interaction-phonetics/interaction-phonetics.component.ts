import {
  Component, signal, OnInit, input
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { NumberedOption, PhoneticsParams } from '../../models/unit-definition';
import { StandardButtonComponent } from '../../shared/standard-button/standard-button.component';
import { createNumberedOptions } from '../../utils/option-helpers';

@Component({
  selector: 'stars-interaction-phonetics',
  templateUrl: './interaction-phonetics.component.html',
  styleUrls: ['./interaction-phonetics.component.scss'],
  imports: [
    StandardButtonComponent
  ],
  standalone: true
})

export class InteractionPhoneticsComponent extends InteractionComponentDirective implements OnInit {
  parameters = input.required<PhoneticsParams>();
  options = signal<NumberedOption[]>([]);
  selectedValues = signal<string>('');

  ngOnInit() {
    const circleOptions = createNumberedOptions(this.parameters().numberOfOptions);

    this.options.set(circleOptions);

    /* Initialize the selectedValues with all 0 */
    this.selectedValues.set('0'.repeat(this.parameters().numberOfOptions));
  }

  onButtonClick(optionId: number): void {
    const newState = this.selectedValues().split('');
    newState[optionId] = newState[optionId] === '1' ? '0' : '1';
    this.selectedValues.set(newState.join(''));

    const id = this.parameters().variableId || 'PHONETICS_BUTTONS';

    const response: Response = {
      id: id,
      status: 'VALUE_CHANGED',
      value: this.selectedValues()
    };

    this.responsesService.newResponses([response]);
    this.responses.emit([response]);
  }

  isSelected(optionId: number): boolean {
    return this.selectedValues()[optionId] === '1';
  }
}
