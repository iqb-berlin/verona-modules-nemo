import {
  Component, signal, OnInit, OnChanges, OnDestroy, input
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import {InteractionButtonParams, SelectionOption} from '../../models/unit-definition';
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
  selectedValues = signal<boolean[]>([]);

  optionRows: Array<Array<RowOption>> = null;
  totalOptions: Array<SelectionOption> = null;

  ngOnChanges(): void {
    this.resetSelection();
    this.totalOptions = this.calcInteractionTypeSettings();
    this.optionRows = this.getRowsOptions();
  }

  ngOnInit(): void {
    this.resetSelection();
    this.totalOptions = this.calcInteractionTypeSettings();
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
      {length: numberOfOptions},
      () => false
    ));
  }

  private calcInteractionTypeSettings() {
    if (!this.parameters().options) return [];

    let options: any[];

    if (this.parameters().options?.repeatButton) {
      options = Array.from(
        {length: this.parameters().options.repeatButton.numberOfOptions},
        (_, index) => ({
          id: index,
          text: this.parameters().options.repeatButton.option.text || null,
          imageSource: this.parameters().options.repeatButton.option.imageSource || null,
          icon: this.parameters().options.repeatButton.option.icon || null,
        })
      )
    } else {
      options = this.parameters().options?.buttons || null;
    }

    return options;
  }

  getRowsOptions():Array<Array<RowOption>> {
    if (!this.parameters().options) return [];

    const numberOfRows = this.parameters().numberOfRows || 1;
    const rows: Array<Array<RowOption>> = [];

    let options = this.totalOptions;
    const baseId = this.parameters().variableId ? this.parameters().variableId : 'BUTTONS';

    const numberOfOptionsPerRow = Math.ceil(options.length / numberOfRows);

    while (options.length > 0) {
      const startIndex = rows.length * numberOfOptionsPerRow;
      const singleRowOptionsIndexed: RowOption[] = options
        .slice(0, numberOfOptionsPerRow)
        .map((option, i) => ({
          option,
          index: startIndex + i,
          id: this.parameters().multiSelect ? baseId + '_' + (startIndex + i) : baseId
        }));

      rows.push(singleRowOptionsIndexed);
      options = options.slice(numberOfOptionsPerRow); // Move to the next chunk of options
    }

    console.log(rows);

    return rows;
  }

  onButtonClick(index: number): void {
    let selectedValues = this.selectedValues();
    const numberOfOptions = this.parameters().options.buttons?.length ||
      this.parameters().options.repeatButton?.numberOfOptions || 0;

    if (this.parameters().multiSelect) {
      selectedValues[index] = !selectedValues[index];
      this.selectedValues.set(selectedValues);
    } else {
      selectedValues = Array.from(
        {length: numberOfOptions},
        () => false
      );
      selectedValues[index] = true;
      this.selectedValues.set(selectedValues);
    }

    const id = this.parameters().variableId || 'INTERACTION_BUTTONS';
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

interface RowOption {
  option: SelectionOption;
  index: number;
  id: string;
}
