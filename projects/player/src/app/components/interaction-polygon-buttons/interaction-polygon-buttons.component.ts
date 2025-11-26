import {
  Component, effect, inject, signal
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

import { VeronaPostService } from '../../services/verona-post.service';
import { StarsResponse } from '../../services/responses.service';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionPolygonButtonsParams } from '../../models/unit-definition';

@Component({
  selector: 'stars-interaction-polygon-buttons',
  templateUrl: './interaction-polygon-buttons.component.html',
  styleUrls: ['./interaction-polygon-buttons.component.scss']
})

export class InteractionPolygonButtonsComponent extends InteractionComponentDirective {
  /** Local copy of the component parameters with defaults applied. */
  localParameters!: InteractionPolygonButtonsParams;
  /** Array of booleans for each option. */
  selectedValues = signal<boolean[]>([]);
  /** Boolean to track if the former the state has been restored from response. */
  private hasRestoredFromFormerState = false;

  veronaPostService = inject(VeronaPostService);

  constructor() {
    effect(() => {
      const parameters = this.parameters() as InteractionPolygonButtonsParams;
      this.localParameters = this.createDefaultParameters();
      this.hasRestoredFromFormerState = false;

      if (parameters) {
        this.localParameters.options = parameters.options || [];
        this.localParameters.variableId = parameters.variableId || 'BUTTONS';
        this.localParameters.multiSelect = parameters.multiSelect || false;
      }

      if (!this.hasRestoredFromFormerState) {
        const formerStateResponse: Response[] = parameters.formerState || [];

        if (Array.isArray(formerStateResponse) && formerStateResponse.length > 0) {
          const foundResponse = formerStateResponse.find(
            response => response.id === this.localParameters.variableId
          );

          if (foundResponse && foundResponse.value) {
            this.restoreFromFormerState(foundResponse);
            this.hasRestoredFromFormerState = true;
            return;
          }
        }

        // No former state found - initialize as new
        this.resetSelection();
        this.responses.emit([{
          id: this.localParameters.variableId || '',
          status: 'DISPLAYED',
          value: 0,
          relevantForResponsesProgress: false
        }]);
        this.hasRestoredFromFormerState = true;
      }

      console.log('localParameters', this.localParameters);
    });
    super();
  }

  private resetSelection(): void {
    if (!this.localParameters.options) return;

    const numberOfOptions = this.localParameters.options?.length || 0;
    this.selectedValues.set(Array.from(
      { length: numberOfOptions },
      () => false
    ));
  }

  click(event) {
    this.updateSelection(event.target.id);
    this.emitResponse('VALUE_CHANGED', true);
  }

  /**
   * Restores the selection state based on user interaction.
   * @param {Response} response - The response object containing a string `value`.
   */
  private restoreFromFormerState(response: Response): void {
    if (!response.value || typeof response.value !== 'string') {
      return;
    }
    if (this.localParameters.multiSelect) {
      // Restore multiselect: "010" => [false, true, false]
      const selectedStates = response.value
        .split('')
        .map((char: string) => char === '1');
      this.selectedValues.set(selectedStates);
    } else {
      // Restore single select: "2" => [false, true, false]
      const selectedIndex = parseInt(response.value, 10) - 1;
      this.setSelectionAtIndex(selectedIndex);
    }
  }

  /**
   * Updates the selection state based on user interaction
   */
  private updateSelection(index: number): void {
    if (this.localParameters.multiSelect) {
      // Toggle the clicked item
      const selectedValues = this.selectedValues();
      selectedValues[index] = !selectedValues[index];
      this.selectedValues.set(selectedValues);
    } else {
      // Single select: reset all and select clicked item
      this.resetSelection();
      const selectedValues = this.selectedValues();
      selectedValues[index] = true;
      this.selectedValues.set(selectedValues);
    }
    console.log('updateSelection', this.selectedValues());
  }

  /**
   * Sets selection to a specific index (single select mode)
   */
  private setSelectionAtIndex(index: number): void {
    console.log('setSelectionAtIndex', index);
    const numberOfOptions = this.localParameters.options?.length || 0;

    const selectedValues = Array.from(
      { length: numberOfOptions },
      (_, i) => i === index
    );
    this.selectedValues.set(selectedValues);
    console.log('setSelectionAtIndex', selectedValues);
  }

  /**
   * Emits the current selection state as a response
   */
  private emitResponse(status: 'DISPLAYED' | 'VALUE_CHANGED', relevant: boolean): void {
    const value = this.localParameters.multiSelect ?
      this.selectedValues().map(item => (item ? 1 : 0)).join('') :
      (this.selectedValues().findIndex(item => item) + 1).toString();

    const response: StarsResponse = {
      id: this.localParameters.variableId || '',
      status: status,
      value: value,
      relevantForResponsesProgress: relevant
    };

    this.responses.emit([response]);
  }

  // eslint-disable-next-line class-methods-use-this
  private createDefaultParameters(): InteractionPolygonButtonsParams {
    return {
      variableId: 'POLYGON_BUTTONS',
      options: [],
      multiSelect: false
    };
  }
}
