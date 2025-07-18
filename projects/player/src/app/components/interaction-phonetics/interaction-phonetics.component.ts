import {
 Component, inject, signal, OnInit
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { ResponsesService } from '../../services/responses.service';
import { VeronaPostService } from '../../services/verona-post.service';

@Component({
  selector: 'stars-interaction-phonetics',
  templateUrl: './interaction-phonetics.component.html',
  styleUrls: ['./interaction-phonetics.component.scss'],
  standalone: true
})

export class PhoneticsComponent extends InteractionComponentDirective implements OnInit {
  options = signal<CircleOption[]>([]);
  selectedState = signal<string>('');

  private responsesService = inject(ResponsesService);
  private veronaPostService = inject(VeronaPostService);

  ngOnInit() {
    const circleOptions: CircleOption[] = Array.from(
      { length: this.optionsLength },
      (_, index) => ({
        id: index,
        text: index + 1
      })
    );

    this.options.set(circleOptions);
    /* Initialize the selectedState with all 0 */
    this.selectedState.set('0'.repeat(this.optionsLength));
  }

  get optionsLength(): number {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return this.parameters().length;
  }

  toggleOption(optionId: number): void {
    const newState = this.selectedState().split('');
    newState[optionId] = newState[optionId] === '1' ? '0' : '1';
    this.selectedState.set(newState.join(''));

    const response: Response = {
      id: 'RESPONSE_PHONETICS_BUTTONS',
      status: 'VALUE_CHANGED',
      value: this.selectedState()
    };

    this.responsesService.newResponses([response], this.veronaPostService);
    this.responses.emit([response]);
  }

  isSelected(optionId: number): boolean {
    return this.selectedState()[optionId] === '1';
  }
}

export interface CircleOption {
  id: number;
  text: number;
}
