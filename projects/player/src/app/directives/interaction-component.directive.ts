import { Directive, input, output } from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

@Directive()

export abstract class InteractionComponentDirective {
  parameters = input<unknown>();
  responses = output<Response[]>();
}
