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
    this.selectedValues.set(null);
  }

  isSelected(index: number): boolean {
    return this.selectedValues() == index;
  }

  animateStyle(index: number): string {
    if (!this.isSelected(index)) return '';

    let style = "";
    let offset = 0;
    offset = ((194 * this.parameters().options.length) / 2) - 87 - (index * 194);
    style += "translate(" + offset + "px,270px)";

    console.log(style);
    return style;
  }

  onButtonClick(index: number): void {
    this.unitService.hasInteraction.set(true);
    this.selectedValues.set(index);

    const id = this.parameters().variableId || 'INTERACTION_DROP';

    const response: Response = {
      id: id,
      status: 'VALUE_CHANGED',
      value: this.selectedValues()
    };

    this.responsesService.newResponses([response]);
    this.responses.emit([response]);
  }
}
