import {
  Component, inject, input, OnChanges, OnDestroy, OnInit, signal
} from '@angular/core';
import { Response } from "@iqbspecs/response/response.interface";

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { WordSelectParams } from "../../models/unit-definition";
import { ResponsesService } from "../../services/responses.service";
import { StandardButtonComponent } from "../../shared/standard-button/standard-button.component";


@Component({
  selector: 'stars-interaction-word-select',
  templateUrl: 'word-select.component.html',
  imports: [
    StandardButtonComponent
  ],
  styleUrls: ['word-select.component.scss']
})

export class WordSelectComponent extends InteractionComponentDirective implements OnInit, OnDestroy, OnChanges {
  parameters = input<WordSelectParams>();
  selectedValues = signal<number>(null);
  responsesService = inject(ResponsesService);

  ngOnChanges() {
    this.resetSelected();
  }

  ngOnInit() {
    console.log(this.parameters());
    this.resetSelected();
    if (this.formerState()?.length > 0) {
      // TODO: last or first element of formerState?
      const state = this.formerState()[0];
      if (state.id === this.parameters().variableId || state.id === "INTERACTION_WORD_SELECT") {
        if (state.value && typeof state.value === 'number') {
          this.selectedValues.set(state.value as number);
        }
      }
    }
  }

  ngOnDestroy(): void {
    console.log(this.parameters());
    console.log('WordSelectComponent ngOnDestroy');
  }

  private resetSelected(): void {
    this.selectedValues.set(null);
  }

  isSelected(index: number): boolean {
    return this.selectedValues() == index;
  }

  onButtonClick(index: number): void {
    this.selectedValues.set(index);

    let id = this.parameters().variableId || "INTERACTION_WORD_SELECT";

    const response: Response = {
      id: id,
      status: 'VALUE_CHANGED',
      value: this.selectedValues()
    };

    this.responsesService.newResponses([response]);
    this.responses.emit([response]);
  }
}
