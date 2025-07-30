import {
  Component, signal, OnInit, OnChanges, OnDestroy, input
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

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

export class InteractionDropComponent extends InteractionComponentDirective implements OnInit, OnChanges, OnDestroy {
  parameters = input.required<InteractionDropParams>();
  selectedValue = signal<number>(null);
  // create a signal for handling disabling transition on change
  disabledTransition = signal<boolean>(false);

  ngOnChanges(): void {
    // Reset selection when parameters change (i.e., when loading a new file)
    this.resetSelection();
  }

  ngOnInit(): void {
    this.resetSelection();
  }

  ngOnDestroy(): void {
    this.resetSelection();
  }

  private resetSelection(): void {
    // before resetting, disable transition to move back instantly
    this.disabledTransition.set(true);
    this.selectedValue.set(null);
    setTimeout(()=>{
      this.disabledTransition.set(false);
    }, 500);
  }

  animateStyle(index: number): string {
    if (this.selectedValue() != index) return '';

    // each button has 200px incl 24px gap/shadow
    // minus half it's size to set target to the center of div
    const offset = ((200 * this.parameters().options.buttons.length) / 2) - 100 - (index * 200);
    return `translate(${offset}px,270px)`;
  }

  onButtonClick(index: number): void {
    /* Toggle selection: if already selected, deselect it
    (this moves the element back to original position) */
    const newSelectedValue = this.selectedValue() === index ? null : index;
    this.selectedValue.set(newSelectedValue);

    const id = this.parameters().variableId || 'INTERACTION_DROP';

    const response: Response = {
      id: id,
      status: 'VALUE_CHANGED',
      value: newSelectedValue + 1
    };

    this.responses.emit([response]);
  }
}
