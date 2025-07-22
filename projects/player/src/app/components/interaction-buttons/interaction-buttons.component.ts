import {
  Component, inject, signal, OnInit, OnChanges, OnDestroy, input
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionButtonParams } from '../../models/unit-definition';
import { ResponsesService } from '../../services/responses.service';
import { StandardButtonComponent } from '../../shared/standard-button/standard-button.component';

@Component({
  selector: 'stars-interaction-buttons',
  templateUrl: './interaction-buttons.component.html',
  imports: [
    StandardButtonComponent
  ],
  styleUrls: ['./interaction-buttons.component.scss']
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

  get params(): string {
    const classes = ['buttons-container'];

    if (this.parameters().multiSelect) {
      classes.push('multiselect');
    }
    if (this.parameters().numberOfRows) {
      classes.push(`rows-${this.parameters().numberOfRows}`);
    }

    return classes.join(' ');
  }

  getRowsOptions() {
    if (!this.parameters().options) return [];

    const totalOptions = this.parameters().options.length;
    const numberOfRows = this.parameters().numberOfRows || 1;
    const rows: Array<Array<any>> = [];

    if (numberOfRows === 2) {
      /* Handle 2 rows case: 4 options 2-2 split, 6 options 3-3 split,
        7 options 4-3 split, 8 options 4-4 split,
        9 options 5-4 split, 10 options 5-5 split
      */
      const firstRowCount = Math.ceil(totalOptions / 2);

      // First row
      rows[0] = this.parameters().options
        .slice(0, firstRowCount)
        .map((option, index) => ({ ...option, index }));

      // Second row
      rows[1] = this.parameters().options
        .slice(firstRowCount)
        .map((option, index) => ({ ...option, index: index + firstRowCount }));
    } else if (numberOfRows === 3) {
      /* Handle 3 rows case: 6 options 2-2-2 split,
        11 options: 5-5-1 split
      */
      if (totalOptions === 11) {
        // Special case for 11 options
        rows[0] = this.parameters()
          .options
          .slice(0, 5)
          .map((option, index) => ({
            ...option,
            index
          }));

        rows[1] = this.parameters()
          .options
          .slice(5, 10)
          .map((option, index) => ({
            ...option,
            index: index + 5
          }));

        rows[2] = this.parameters()
          .options
          .slice(10)
          .map((option, index) => ({
            ...option,
            index: index + 10
          }));
      } else {
        const itemsPerRow = Math.ceil(totalOptions / 3);

        // First row
        rows[0] = this.parameters().options
          .slice(0, itemsPerRow)
          .map((option, index) => ({ ...option, index }));

        // Second row
        rows[1] = this.parameters().options
          .slice(itemsPerRow, itemsPerRow * 2)
          .map((option, index) => ({ ...option, index: index + itemsPerRow }));

        // Third row
        rows[2] = this.parameters().options
          .slice(itemsPerRow * 2)
          .map((option, index) => ({
            ...option,
            index: index + (itemsPerRow * 2)
          }));
      }
    } else {
      // Single row case
      rows[0] = this.parameters().options
        .map((option, index) => ({ ...option, index }));
    }

    return rows;
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

    const response: Response = {
      id: 'RESPONSE_INTERACTION_BUTTONS',
      status: 'VALUE_CHANGED',
      value: this.selectedValues()
    };

    this.responsesService.newResponses([response]);
    this.responses.emit([response]);
  }
}
