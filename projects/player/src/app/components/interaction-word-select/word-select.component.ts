import { Component, OnDestroy, OnInit } from '@angular/core';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';

@Component({
  selector: 'stars-interaction-word-select',
  template: `
    <div>word-select component</div>
  `,
  standalone: false
})

export class WordSelectComponent extends InteractionComponentDirective implements OnInit, OnDestroy {
  ngOnInit() {
    console.log(this.parameters.toString());
  }

  ngOnDestroy(): void {
    console.log(this.parameters.toString());
    console.log('WordSelectComponent ngOnDestroy');
  }
}
