import {
  Component,
  computed,
  effect,
  signal
} from '@angular/core';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { IconButtonTypeEnum, InteractionCountParams, SelectionOption } from '../../models/unit-definition';
import { StandardIconComponent } from '../../shared/standard-icon/standard-icon.component';

@Component({
  selector: 'stars-interaction-count',
  templateUrl: './interaction-count.component.html',
  styleUrls: ['./interaction-count.component.scss'],
  imports: [StandardIconComponent]
})
export class InteractionCountComponent extends InteractionComponentDirective {
  localParameters!: InteractionCountParams;

  // expose options as a signal for template
  readonly optionsSig = signal<SelectionOption[]>([]);

  // For the required layout: two columns
  readonly tensItems = computed(() => this.expandIcon('TENS'));
  readonly onesItems = computed(() => this.expandIcon('ONES'));

  constructor() {
    super();

    effect(() => {
      const parameters = this.parameters() as InteractionCountParams;
      this.localParameters = InteractionCountComponent.createDefaultParameters();
      if (parameters) {
        this.localParameters.variableId = parameters.variableId || 'COUNT';
        this.localParameters.text = parameters.text || '';
        this.localParameters.imageSource = parameters.imageSource || '';
        this.localParameters.imagePosition = parameters.imagePosition || 'TOP';
        this.localParameters.options = parameters.options || [];
        this.optionsSig.set(this.localParameters.options);

        // Emit displayed response so progress logic works similar to other interactions
        this.responses.emit([{
          id: this.localParameters.variableId,
          status: 'DISPLAYED',
          value: '',
          relevantForResponsesProgress: false
        }]);
      }
    });
  }

  private expandIcon(icon: IconButtonTypeEnum) {
    const opt = this.optionsSig().find(o => o.icon === icon);
    const repeat = opt?.repeat ?? 0;
    return Array.from({ length: repeat }, () => ({ icon } as const satisfies SelectionOption));
  }

  // eslint-disable-next-line class-methods-use-this
  private static createDefaultParameters(): InteractionCountParams {
    return {
      variableId: 'COUNT',
      text: '',
      imagePosition: 'TOP',
      options: []
    };
  }
}
