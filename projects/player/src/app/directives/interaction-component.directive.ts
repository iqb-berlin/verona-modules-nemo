import {
  Directive, inject, input, output
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';
import { ResponsesService } from '../services/responses.service';

@Directive()

export abstract class InteractionComponentDirective {
  formerState = input<Response[]>();
  responses = output<Response[]>();

  protected responsesService = inject(ResponsesService);
}
