import {
  Component, signal, effect, OnInit
} from '@angular/core';

import { StarsResponse } from '../../services/responses.service';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import {
  InteractionButtonParams,
  SelectionOption
} from '../../models/unit-definition';
import { StandardButtonComponent } from '../../shared/standard-button/standard-button.component';

@Component({
  selector: 'stars-interaction-buttons',
  templateUrl: './interaction-buttons.component.html',
  imports: [
    StandardButtonComponent
  ],
  styleUrls: ['./interaction-buttons.component.scss']
})

export class InteractionButtonsComponent extends InteractionComponentDirective implements OnInit {
  localParameters: InteractionButtonParams;
  // array of booleans for each option
  selectedValues = signal<boolean[]>([]);
  // options sorted by rows
  optionRows: Array<Array<RowOption>> = null;
  // Array of all options aka Buttons to be shown
  allOptions: Array<SelectionOption> = null;
  // imagePosition for stimulus image if available
  imagePosition: string = 'TOP';

  constructor() {
    super();

    effect(() => {
      const parameters = this.parameters() as InteractionButtonParams;

      this.localParameters = this.createDefaultParameters();

      if (parameters) {
        this.localParameters.options = parameters.options || null;
        this.localParameters.variableId = parameters.variableId || 'BUTTONS';
        this.localParameters.imageSource = parameters.imageSource || null;
        this.localParameters.numberOfRows = parameters.numberOfRows || 1;
        this.localParameters.multiSelect = parameters.multiSelect || false;
        this.localParameters.buttonType = parameters.buttonType || 'MEDIUM_SQUARE';
        this.localParameters.numberOfRows = parameters.numberOfRows || 1;
        this.localParameters.text = parameters.text || null;

        if (this.localParameters.imageSource) {
          this.localParameters.imagePosition = parameters.imagePosition || 'LEFT';
        } else {
          this.localParameters.imagePosition = 'TOP';
        }
      }

      this.resetSelection();
      this.allOptions = this.createOptions();
      this.optionRows = this.getRowsOptions();
    });
  }

  ngOnInit() {
    this.responses.emit([{
      // @ts-expect-error access parameter of unknown
      id: this.parameters().variableId || 'BUTTONS',
      status: 'DISPLAYED',
      value: 0,
      relevantForResponsesProgress: false
    }]);
  }

  private resetSelection(): void {
    if (!this.localParameters.options) return;

    const numberOfOptions = this.localParameters.options?.buttons?.length ||
      this.localParameters.options?.repeatButton?.numberOfOptions || 0;
    this.selectedValues.set(Array.from(
      { length: numberOfOptions },
      () => false
    ));
  }

  // function to create options array for items with repeat buttons
  private createOptions() {
    if (!this.localParameters.options) return [];

    // eslint-disable-next-line
    let options:any[];

    if (this.localParameters.options?.repeatButton) {
      options = Array.from(
        { length: this.localParameters.options.repeatButton.numberOfOptions },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _ => ({
          text: this.localParameters.options.repeatButton.option?.text || null,
          imageSource: this.localParameters.options.repeatButton.option?.imageSource || null,
          icon: this.localParameters.options.repeatButton.option?.icon || null
        })
      );
    } else {
      options = this.localParameters.options?.buttons || null;
    }

    if (this.localParameters.imageSource) {
      this.imagePosition = this.localParameters.imagePosition ? this.localParameters.imagePosition : 'LEFT';
    } else {
      this.imagePosition = 'TOP';
    }

    return options;
  }

  getRowsOptions():Array<Array<RowOption>> {
    if (!this.localParameters.options) return [];

    const numberOfRows = this.localParameters.numberOfRows;
    const rows: Array<Array<RowOption>> = [];

    let options = this.allOptions;
    const baseId = this.localParameters.variableId;

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
          id: this.localParameters.multiSelect ? `${baseId}_${startIndex + i}` : baseId
        }));

      rows.push(singleRowOptionsIndexed);
      // slice off options of current row and go to the next chunk of options
      options = options.slice(numberOfOptionsPerRow);
    }

    return rows;
  }

  onButtonClick(index: number): void {
    let selectedValues = this.selectedValues();
    const numberOfOptions = this.localParameters.options?.buttons?.length ||
      this.localParameters.options?.repeatButton?.numberOfOptions || 0;

    if (this.localParameters.multiSelect) {
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

    /* stringify boolean array to string of 0 and 1 for multiselect or
       index of selected item for single select */
    const value = this.localParameters.multiSelect ?
      this.selectedValues().map(item => (item ? 1 : 0)).join('') :
      (this.selectedValues().findIndex(item => item) + 1).toString();

    const response: StarsResponse = {
      id: this.localParameters.variableId,
      status: 'VALUE_CHANGED',
      value: value,
      relevantForResponsesProgress: true
    };

    this.responses.emit([response]);
  }

  // eslint-disable-next-line class-methods-use-this
  private createDefaultParameters(): InteractionButtonParams {
    return {
      variableId: 'BUTTONS',
      options: null,
      imageSource: null,
      imagePosition: 'TOP',
      text: null,
      multiSelect: false,
      numberOfRows: 1,
      buttonType: 'MEDIUM_SQUARE'
    };
  }
}

// helper interface for options in row array - need to track index from allOptions Array
interface RowOption {
  option: SelectionOption;
  index: number;
  id: string;
}
