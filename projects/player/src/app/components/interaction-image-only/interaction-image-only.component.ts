import {
  Component, effect
} from '@angular/core';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionImageOnlyParams } from '../../models/unit-definition';

@Component({
  selector: 'stars-interaction-image-only',
  templateUrl: './interaction-image-only.component.html',
  styleUrls: ['./interaction-image-only.component.scss']
})

export class InteractionImageOnlyComponent extends InteractionComponentDirective {
  localParameters: InteractionImageOnlyParams;

  constructor() {
    super();

    effect(() => {
      const parameters = this.parameters() as InteractionImageOnlyParams;
      this.localParameters = this.createDefaultParameters();
      if (parameters) {
        this.localParameters.imageSource = parameters.imageSource || null;
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private createDefaultParameters(): InteractionImageOnlyParams {
    return {
      imageSource: null
    };
  }
}
