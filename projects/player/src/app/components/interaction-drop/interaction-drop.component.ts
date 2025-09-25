import {
  Component, signal, effect
} from '@angular/core';

import { StarsResponse } from '../../services/responses.service';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionDropParams } from '../../models/unit-definition';
import { StandardButtonComponent } from '../../shared/standard-button/standard-button.component';

@Component({
  selector: 'stars-interaction-drop',
  templateUrl: './interaction-drop.component.html',
  imports: [
    StandardButtonComponent
  ],
  styleUrls: ['./interaction-drop.component.scss']
})

export class InteractionDropComponent extends InteractionComponentDirective {
  localParameters!: InteractionDropParams;
  selectedValue = signal<number>(-1);
  // create a signal for handling disabling transition on change
  disabledTransition = signal<boolean>(false);

  constructor() {
    super();

    effect(() => {
      const parameters = this.parameters() as InteractionDropParams;

      this.localParameters = this.createDefaultParameters();

      if (parameters) {
        this.localParameters.options = parameters.options || [];
        this.localParameters.variableId = parameters.variableId || 'DROP';
        this.localParameters.imageSource = parameters.imageSource || '';
        this.localParameters.text = parameters.text || '';
        this.localParameters.imagePosition = parameters.imagePosition || 'BOTTOM'; // Default to BOTTOM
        this.localParameters.imageLandingXY = parameters.imageLandingXY || '';

        this.responses.emit([{
          id: this.localParameters.variableId,
          status: 'DISPLAYED',
          value: 0,
          relevantForResponsesProgress: false
        }]);
      }

      this.resetSelection();
    });
  }

  private resetSelection(): void {
    // before resetting, disable transition to move back instantly
    this.disabledTransition.set(true);
    this.selectedValue.set(-1);
    setTimeout(() => {
      this.disabledTransition.set(false);
    }, 500);
  }

  animateStyle(index: number): string {
    if (this.selectedValue() !== index) return '';

    const totalButtons = this.localParameters.options.length;
    const buttonContainerWidth = 170; // SMALL_SQUARE button container width
    const gapWidth = 24;
    const borderOffset = 8;
    const buttonWidth = buttonContainerWidth - gapWidth;
    const totalWidth = totalButtons * buttonContainerWidth; // Total width of the button container
    const containerCenter = totalWidth / 2; // Center of button container
    const buttonCenter = buttonWidth / 2; // Distance from container edge to a button center

    // X position of THIS button's center
    const currentButtonCenter = (index * buttonContainerWidth) + buttonCenter + borderOffset;

    // Base X offset to center inside the buttons container
    const baseOffsetX = containerCenter - currentButtonCenter;

    // If imageLandingXY is provided
    if (this.localParameters.imageLandingXY !== '') {
      // ... existing code ...
      const coords = this.localParameters.imageLandingXY.split(',');
      const x = coords[0]?.trim() ?? '0';
      const y = coords[1]?.trim() ?? '0';

      // The x,y given are an absolute/static position on the image.
      // We need to compensate for the button's initial horizontal position
      // so every button lands at the same x on the image.
      const landingX = Number.isFinite(Number(x)) ? Number(x) : 0;
      const landingY = Number.isFinite(Number(y)) ? Number(y) : 0;

      // currentButtonCenter is the button center's x within the buttons row.
      // We want to translate so that the final center-x equals landingX.
      const deltaX = landingX - currentButtonCenter;

      // For Y we just use the provided absolute landingY (relative to the same origin as X).
      const xPx = `${deltaX}px`;
      const yPx = `${landingY}px`;

      return `translate(${xPx}, ${yPx})`;
    }

    // Fallback when imageLandingXY is empty: move up/down based on imagePosition
    const transformY = this.localParameters.imagePosition === 'TOP' ? '-280px' : '280px';
    return `translate(${baseOffsetX}px, ${transformY})`;
  }

  onButtonClick(index: number): void {
    /* Toggle selection: if already selected, deselect it
    (this moves the element back to the original position) */
    this.selectedValue.set(this.selectedValue() === index ? -1 : index);

    const response: StarsResponse = {
      id: this.localParameters.variableId,
      status: 'VALUE_CHANGED',
      value: this.selectedValue() + 1,
      relevantForResponsesProgress: true
    };

    this.responses.emit([response]);
  }

  // eslint-disable-next-line class-methods-use-this
  private createDefaultParameters(): InteractionDropParams {
    return {
      variableId: 'DROP',
      options: [],
      imageSource: '',
      imagePosition: 'BOTTOM',
      imageLandingXY: '',
      text: ''
    };
  }
}
