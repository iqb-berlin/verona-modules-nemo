import {
  Component, inject, signal, OnInit, OnChanges, OnDestroy, input
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionButtonParams, SelectionOption } from '../../models/unit-definition';
import { ResponsesService } from '../../services/responses.service';

@Component({
  selector: 'stars-interaction-buttons',
  templateUrl: './interaction-buttons.component.html',
  styleUrls: ['./interaction-buttons.component.scss'],
  standalone: true
})

export class InteractionButtonsComponent extends InteractionComponentDirective implements OnInit, OnChanges, OnDestroy {
  parameters = input.required<InteractionButtonParams>();
  selectedValues = signal<number[]>([]);
  responsesService = inject(ResponsesService);

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
    this.selectedValues.set([]);
  }


  get options(): SelectionOption[] {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return this.parameters().options;
  }

  get params(): string {
    const classes = ['buttons-container'];

    if (this.parameters().multiSelect) {
      classes.push('multiselect');
    }
    if (this.parameters().numberOfRows) {
      classes.push(this.parameters().numberOfRows + '-rows');
    }

    return classes.join(' ');
  }

  isSelected(index: number): boolean {
    return this.selectedValues().includes(index);
  }

  onButtonClick(index: number): void {
    const currentSelected = this.selectedValues();

    if (this.parameters().multiSelect) {
      if (currentSelected.includes(index)) {
        /* Remove if already selected */
        this.selectedValues.set(currentSelected.filter(i => i !== index));
      } else {
        /* Add to selection */
        this.selectedValues.set([...currentSelected, index]);
      }
    } else {
      /* Handle single selection */
      this.selectedValues.set([index]);
    }

    console.log(this.selectedValues());

    const response: Response = {
      id: 'RESPONSE_INTERACTION_BUTTONS',
      status: 'VALUE_CHANGED',
      value: this.selectedValues()
    };

    this.responsesService.newResponses([response]);
    this.responses.emit([response]);
  }
}
