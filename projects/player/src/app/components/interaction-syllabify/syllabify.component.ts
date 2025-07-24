import {Component, input, OnDestroy, OnInit} from '@angular/core';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import {SyllabifyParams} from "../../models/unit-definition";

@Component({
  selector: 'stars-interaction-syllabify',
  template: `
    <div>syllabify component; length: {{length}}</div>
  `
})

export class SyllabifyComponent extends InteractionComponentDirective implements OnInit, OnDestroy {
  parameters = input.required<SyllabifyParams>();

  get length(): number {
    // @ts-ignore
    return this.parameters().length;
  }

  ngOnInit() {
    console.log(this.parameters());
  }

  ngOnDestroy(): void {
    console.log(this.parameters());
    console.log('SyllabifyComponent ngOnDestroy');
  }
}
