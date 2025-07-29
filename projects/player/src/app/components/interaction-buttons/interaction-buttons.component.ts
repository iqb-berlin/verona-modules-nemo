import {
  Component, inject, signal, OnInit, OnChanges, OnDestroy, input
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionButtonParams, SelectionOption } from '../../models/unit-definition';
import { ResponsesService } from '../../services/responses.service';
import { UnitService } from '../../services/unit.service';
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
  unitService = inject(UnitService);

  optionRows: Array<Array<RowOption>> = null;

  ngOnChanges(): void {
    /* Reset selection when parameters change (i.e., when loading a new file) */
    this.resetSelection();
    this.optionRows = this.getRowsOptions();
  }

  ngOnInit(): void {
    this.resetSelection();
    this.optionRows = this.getRowsOptions();
  }

  ngOnDestroy(): void {
    this.resetSelection();
  }

  private resetSelection(): void {
    this.selectedValues.set([]);
  }

  getRowsOptions():Array<Array<RowOption>> {
    if (!this.parameters().options) return [];

    const totalOptions = this.parameters().options.length;
    const numberOfRows = this.parameters().numberOfRows || 1;
    const rows: Array<Array<RowOption>> = [];

    let options = this.parameters().options;

    /* If the calculation results more than 5 options in a row, cap it at 5 */
    const numberOfOptionsPerRow = Math.min(Math.ceil(totalOptions / numberOfRows), 5);

    while (options.length > 0) {
      const startIndex = rows.length * numberOfOptionsPerRow;
      const singleRowOptionsIndexed: RowOption[] = options
        .slice(0, numberOfOptionsPerRow)
        .map((option, i) => ({
          option,
          index: startIndex + i
        }));

      rows.push(singleRowOptionsIndexed);
      options = options.slice(numberOfOptionsPerRow); // Move to the next chunk of options
    }

    return rows;
  }

  isSelected(index: number): boolean {
    return this.selectedValues().includes(index);
  }

  onButtonClick(index: number): void {
    /* Track user engagement to activate the Continue button ON_INTERACTION */
    this.unitService.hasInteraction.set(true);

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

    const id = this.parameters().variableId || 'INTERACTION_BUTTONS';

    const response: Response = {
      id: id,
      status: 'VALUE_CHANGED',
      value: this.selectedValues()
    };

    this.responsesService.newResponses([response]);
    this.responses.emit([response]);
  }
}

interface RowOption {
  option: SelectionOption;
  index: number;
}
