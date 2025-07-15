import { Component, OnDestroy, OnInit } from '@angular/core';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';

@Component({
  selector: 'stars-interaction-buttons',
  template: `
    <div [style.flex]="'flex'">buttons component</div>
  `,
  standalone: false
})

export class ButtonsComponent extends InteractionComponentDirective implements OnInit, OnDestroy {
  ngOnInit() {
    console.log(this.parameters.toString());
  }

  ngOnDestroy(): void {
    console.log(this.parameters.toString());
    console.log('ButtonsComponent ngOnDestroy');
  }
}
