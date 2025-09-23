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
        this.localParameters.imageLandingXY = parameters.imageLandingXY || '50,50';

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
    const buttonContainerWidth = 170; // Because we are using SMALL_SQUARE as the type of standard button
    const gapWidth = 24;
    const borderOffset = 8;
    const buttonWidth = buttonContainerWidth - gapWidth;
    const totalWidth = totalButtons * buttonContainerWidth; // Total width of the button container
    const containerCenter = totalWidth / 2; // Center of button container
    const buttonCenter = buttonWidth / 2; // Distance from container edge to a button center

    // eslint-disable-next-line max-len
    const currentButtonCenter = (index * buttonContainerWidth) + buttonCenter + borderOffset; // X position of THIS button's center

    // Move button to a container center
    const offsetX = containerCenter - currentButtonCenter;

    // If imageLandingXY is provided, use it
    if (this.localParameters.imageLandingXY) {
      // Check if imageLandingXY contains both X and Y coordinates
      if (this.localParameters.imageLandingXY.includes(',')) {
        // Split the coordinates
        const coords = this.localParameters.imageLandingXY.split(',');
        const x = coords[0]?.trim() ?? '';
        const y = coords[1]?.trim() ?? '';

        // If X is 0, use the calculated offsetX instead
        if (x === '0' && y) {
          console.log('X IS 0, USING OFFSET X', offsetX);
          return `translate(${offsetX}px, ${y}px)`;
        }
        // Otherwise use the provided X,Y values
        console.log('THERE IS X AND Y COORDINATE', x, y);
        return `translate(${x}px, ${y}px})`;
      }
      // It contains only a Y coordinate, keep using our calculated X
      return `translate(${offsetX}px, ${this.localParameters.imageLandingXY}px)`;
    }

    // Fallback for when imageLandingXY is not provided
    // Determine Y position based on imagePosition
    let transformY = '280px'; // Default for BOTTOM position - moves down

    if (this.localParameters.imagePosition === 'TOP') {
      transformY = '-280px'; // Button goes UP when image is at top
    }

    return `translate(${offsetX}px, ${transformY})`;
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
      imageLandingXY: '50,50',
      text: ''
    };
  }
}
