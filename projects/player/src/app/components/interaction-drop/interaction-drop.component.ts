import {
  Component, inject, signal, OnInit, OnChanges, OnDestroy, input
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionDropParams } from '../../models/unit-definition';
import { ResponsesService } from '../../services/responses.service';
import { UnitService } from '../../services/unit.service';
import { StandardButtonComponent } from '../../shared/standard-button/standard-button.component';

@Component({
  selector: 'stars-interaction-drop',
  templateUrl: './interaction-drop.component.html',
  imports: [
    StandardButtonComponent
  ],
  styleUrls: ['./interaction-drop.component.scss']
})

export class InteractionDropComponent extends InteractionComponentDirective implements OnInit, OnChanges, OnDestroy {
  parameters = input.required<InteractionDropParams>();
  selectedValues = signal<number>(null);
  responsesService = inject(ResponsesService);
  unitService = inject(UnitService);
  disabledTransition = signal<boolean>(false);

  ngOnChanges(): void {
    /* Reset selection when parameters change (i.e., when loading a new file) */
    this.resetSelection();
  }

  ngOnInit(): void {
    this.resetSelection();
  }

  ngOnDestroy(): void {
    this.resetSelection();
  }

  private resetSelection(): void {
    this.disabledTransition.set(true);
    this.selectedValues.set(null);
    setTimeout(()=>{
      this.disabledTransition.set(false);
    }, 500);
  }

  isSelected(index: number): boolean {
    return this.selectedValues() == index;
  }

  animateStyle(index: number): string {
    if (!this.isSelected(index)) return '';

    // each button has 170px plus 24px gap/shadow
    // minus half it's size to set target to the center of div
    const offset = ((194 * this.parameters().options.buttons.length) / 2) - 87 - (index * 194);
    return `translate(${offset}px,270px)`;
  }

  onButtonClick(index: number): void {
    this.unitService.hasInteraction.set(true);

    /* Toggle selection: if already selected, deselect it
    (this moves the element back to original position) */
    const newSelectedValue = this.selectedValues() === index ? null : index;

    this.selectedValues.set(newSelectedValue);

    const id = this.parameters().variableId || 'DROP';

    const response: Response = {
      id: id,
      status: 'VALUE_CHANGED',
      value: newSelectedValue
    };

    this.responsesService.newResponses([response]);
    this.responses.emit([response]);
  }
}
