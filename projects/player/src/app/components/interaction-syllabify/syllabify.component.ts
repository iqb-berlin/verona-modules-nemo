import { Component, OnDestroy, OnInit } from '@angular/core';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';

@Component({
  selector: 'stars-interaction-syllabify',
  template: `
    <div>syllabify component</div>
  `,
  standalone: false
})

export class SyllabifyComponent extends InteractionComponentDirective implements OnInit, OnDestroy {
  ngOnInit() {
    console.log(this.parameters.toString());
  }

  ngOnDestroy(): void {
    console.log(this.parameters.toString());
    console.log('SyllabifyComponent ngOnDestroy');
  }
}
