import {
  Component, input, OnInit, signal
} from '@angular/core';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { NumberedOption, SyllabifyParams } from '../../models/unit-definition';
import { StandardButtonComponent } from '../../shared/standard-button/standard-button.component';

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

  ngOnInit() {
    const squareOptions: NumberedOption[] = Array.from(
      { length: this.parameters().numberOfOptions },
      (_, index) => ({
        id: index,
        text: (index + 1).toString()
      })
    );

    this.options.set(squareOptions);

    /* Initialize the selectedValues with all 0 */
    this.initializeBinarySelection(this.parameters().numberOfOptions);
  }

  onButtonClick(optionId: number): void {
    this.toggleBinarySelection(optionId, this.parameters().variableId, 'SYLLABIFY_BUTTONS');
  }

  isSelected(optionId: number): boolean {
    return this.isSelectedAtIndex(optionId);
  }
}
