import {
  Directive, input, output
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';

@Directive()

export abstract class InteractionComponentDirective {
  formerState = input<Response[]>();
  responses = output<Response[]>();
}
