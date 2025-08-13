import {
  Directive, input, output
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';
import { StarsResponse } from '../services/responses.service';

@Directive()

export abstract class InteractionComponentDirective {
  parameters = input.required<unknown>();
  formerState = input<Response[]>();
  responses = output<StarsResponse[]>();
}
