import {Component, input, OnDestroy, OnInit} from '@angular/core';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import {SyllabifyParams, WordSelectParams} from "../../models/unit-definition";

@Component({
  selector: 'stars-interaction-word-select',
  template: `
    <div>word-select component</div>
  `,
  standalone: false
})

export class WordSelectComponent extends InteractionComponentDirective implements OnInit, OnDestroy {
  parameters = input.required<WordSelectParams>();

  ngOnInit() {
    console.log(this.parameters());
  }

  ngOnDestroy(): void {
    console.log(this.parameters());
    console.log('WordSelectComponent ngOnDestroy');
  }
}
