import { Component } from '@angular/core';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { SelectionOption } from '../../models/unit-definition';

@Component({
  selector: 'stars-interaction-buttons',
  template: `
    <div class="container">
      @for (b of options; track b) {
        <stars-standard-button [text]="b.text" [image]="b.image"></stars-standard-button>
      }
    </div>
  `,
  standalone: false,
  styles: [`
    .container {
      flex: auto;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  `
  ]
})

export class ButtonsComponent extends InteractionComponentDirective {
  get options(): SelectionOption[] {
    // @ts-ignore
    return this.parameters().options;
  }
}
