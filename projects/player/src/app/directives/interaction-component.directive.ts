import { Directive, inject, input, output, signal } from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';
import { ResponsesService } from '../services/responses.service';

@Directive()

export abstract class InteractionComponentDirective {
  formerState = input<Response[]>();
  responses = output<Response[]>();

  protected responsesService = inject(ResponsesService);
  protected selectedOptions = signal<string>('');

  protected toggleBinarySelection(optionId: number, variableId: string, defaultId: string): void {
    const newState = this.selectedOptions().split('');
    newState[optionId] = newState[optionId] === '1' ? '0' : '1';
    this.selectedOptions.set(newState.join(''));

    const id = variableId || defaultId;

    const response: Response = {
      id: id,
      status: 'VALUE_CHANGED',
      value: this.selectedOptions()
    };

    this.responsesService.newResponses([response]);
    this.responses.emit([response]);
  }

  protected initializeBinarySelection(numberOfOptions: number): void {
    this.selectedOptions.set('0'.repeat(numberOfOptions));
  }

  protected isSelectedAtIndex(optionId: number): boolean {
    return this.selectedOptions()[optionId] === '1';
  }
}
