import {
  Component, signal, OnInit, OnChanges, OnDestroy, input
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionButtonParams, SelectionOption } from '../../models/unit-definition';
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
  // array of booleans for each option
  selectedValues = signal<boolean[]>([]);

  // options sorted by rows
  optionRows: Array<Array<RowOption>> = null;
  // Array of all options aka Buttons to be shown
  allOptions: Array<SelectionOption> = null;
  // imagePosition for stimulus image if available
  imagePosition: string = "TOP";

  ngOnChanges(): void {
    // Reset selection when parameters change (i.e., when loading a new file)
    this.resetSelection();
    this.allOptions = this.createOptions();
    this.optionRows = this.getRowsOptions();
  }

  ngOnInit(): void {
    this.resetSelection();
    this.allOptions = this.createOptions();
    this.optionRows = this.getRowsOptions();
  }

  ngOnDestroy(): void {
    this.resetSelection();
  }

  private resetSelection(): void {
    if (!this.parameters().options) return;

    const numberOfOptions = this.parameters().options.buttons?.length ||
      this.parameters().options.repeatButton?.numberOfOptions || 0;
    this.selectedValues.set(Array.from(
      { length: numberOfOptions },
      () => false
    ));
  }

  // function to create options array for items with repeat buttons
  private createOptions() {
    if (!this.parameters().options) return [];

    let options: any[];

    if (this.parameters().options?.repeatButton) {
      options = Array.from(
        { length: this.parameters().options.repeatButton.numberOfOptions },
        (_, index) => ({
          text: this.parameters().options.repeatButton.option.text || null,
          imageSource: this.parameters().options.repeatButton.option.imageSource || null,
          icon: this.parameters().options.repeatButton.option.icon || null,
        })
      )
    } else {
      options = this.parameters().options?.buttons || null;
    }

    if (this.parameters().imageSource) {
      this.imagePosition = this.parameters().imagePosition ? this.parameters().imagePosition : 'LEFT';
    } else {
      this.imagePosition = 'TOP';
    }

    return options;
  }

  getRowsOptions():Array<Array<RowOption>> {
    if (!this.parameters().options) return [];

    const numberOfRows = this.parameters().numberOfRows || 1;
    const rows: Array<Array<RowOption>> = [];

    let options = this.allOptions;
    const baseId = this.parameters().variableId ? this.parameters().variableId : 'BUTTONS';

    // calculate number of options in each row, last row might be shorter
    const numberOfOptionsPerRow = Math.ceil(options.length / numberOfRows);

    // generate arrays of options for each row
    while (options.length > 0) {
      const startIndex = rows.length * numberOfOptionsPerRow;
      const singleRowOptionsIndexed: RowOption[] = options
        .slice(0, numberOfOptionsPerRow)
        /* generate array of object containing option data and generated id
           and keep track of index in allOptions array */
        .map((option, i) => ({
          option,
          index: startIndex + i,
          id: this.parameters().multiSelect ? baseId + '_' + (startIndex + i) : baseId
        }));

      rows.push(singleRowOptionsIndexed);
      // slice off options of current row and go to the next chunk of options
      options = options.slice(numberOfOptionsPerRow);
    }

    console.log(rows);

    return rows;
  }

  onButtonClick(index: number): void {
    let selectedValues = this.selectedValues();
    const numberOfOptions = this.parameters().options.buttons?.length ||
      this.parameters().options.repeatButton?.numberOfOptions || 0;

    if (this.parameters().multiSelect) {
      // toggle selected item for multiselect
      selectedValues[index] = !selectedValues[index];
      this.selectedValues.set(selectedValues);
    } else {
      // reset array and set selected item to true for single select
      // no toggle here
      selectedValues = Array.from(
        { length: numberOfOptions },
        () => false
      );
      selectedValues[index] = true;
      this.selectedValues.set(selectedValues);
    }

    const id = this.parameters().variableId || 'INTERACTION_BUTTONS';
    /* stringify boolean array to string of 0 and 1 for multiselect or
       index of selected item for single select */
    const value = this.parameters().multiSelect ?
      this.selectedValues().map(item => item ? 1 : 0).join("") :
      (this.selectedValues().findIndex(item => item) + 1).toString();

    const response: Response = {
      id: id,
      status: 'VALUE_CHANGED',
      value: value
    };

    this.responses.emit([response]);
  }
}

// helper interface for options in row array - need to track index from allOptions Array
interface RowOption {
  option: SelectionOption;
  index: number;
  id: string;
}
