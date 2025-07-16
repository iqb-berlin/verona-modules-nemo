import { Component, OnDestroy, OnInit } from '@angular/core';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import {SelectionOption} from "../../models/unit-definition";

@Component({
  selector: 'stars-interaction-syllabify',
  template: `
    <div>syllabify component; length: {{length}}</div>
  `,
  standalone: false
})

export class SyllabifyComponent extends InteractionComponentDirective implements OnInit, OnDestroy {
  get length(): number {
    // @ts-ignore
    return this.parameters().length;
  }

  ngOnInit() {
    console.log(this.parameters.toString());
  }

  ngOnDestroy(): void {
    console.log(this.parameters.toString());
    console.log('SyllabifyComponent ngOnDestroy');
  }
}
