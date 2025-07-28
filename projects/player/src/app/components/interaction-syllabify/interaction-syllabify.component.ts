import {
  Component, input, OnInit, signal
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { NumberedOption, SyllabifyParams } from '../../models/unit-definition';
import { StandardButtonComponent } from '../../shared/standard-button/standard-button.component';
import { createNumberedOptions } from '../../utils/option-helpers';

@Component({
  selector: 'stars-interaction-syllabify',
  templateUrl: './interaction-syllabify.component.html',
  styleUrls: ['./interaction-syllabify.component.scss'],
  imports: [
    StandardButtonComponent
  ],
  standalone: true
})

export class InteractionSyllabifyComponent extends InteractionComponentDirective implements OnInit {
  parameters = input.required<SyllabifyParams>();
  options = signal<NumberedOption[]>([]);
  selectedValues = signal<string>('');

  ngOnInit() {
    const squareOptions = createNumberedOptions(this.parameters().numberOfOptions);

    this.options.set(squareOptions);

    /* Initialize the selectedValues with all 0 */
    this.selectedValues.set('0'.repeat(this.parameters().numberOfOptions));
  }

  onButtonClick(optionId: number): void {
    const newState = this.selectedValues().split('');
    newState[optionId] = newState[optionId] === '1' ? '0' : '1';
    this.selectedValues.set(newState.join(''));

    const id = this.parameters().variableId || 'SYLLABIFY_BUTTONS';

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
