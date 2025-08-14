import {
  Component, effect, ElementRef, signal, ViewChild
} from '@angular/core';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionFindOnImageParams } from '../../models/unit-definition';

@Component({
  selector: 'stars-interaction-find-on-image',
  templateUrl: './find-on-image.component.html',
  styleUrls: ['./find-on-image.component.scss']
})

export class InteractionFindOnImageComponent extends InteractionComponentDirective {
  localParameters: InteractionFindOnImageParams;
  clickTargetTop = signal('0px');
  clickTargetLeft = signal('0px');

  @ViewChild('imageElement', { static: false }) imageRef!: ElementRef<HTMLImageElement>;
  buttonDisabled = signal(true);

  constructor() {
    super();

    effect(() => {
      const parameters = this.parameters() as InteractionFindOnImageParams;
      this.localParameters = this.createDefaultParameters();
      if (parameters) {
        this.localParameters.variableId = parameters.variableId || 'FIND_ON_IMAGE';
        this.localParameters.imageSource = parameters.imageSource || '';
        this.localParameters.text = parameters.text || '';
        this.localParameters.size = parameters.size || 'SMALL';
      }
    });
  }

  onClick(event) {
    if (this.buttonDisabled()) this.buttonDisabled.set(false);

    const top:number = event.layerY;
    const left:number = event.layerX;

    console.log(left, top);
    console.log(this.imageRef.nativeElement.width, this.imageRef.nativeElement.height);
    if (this.imageRef.nativeElement.width >= left || left >= 0) this.clickTargetLeft.set(`${left}px`);
    if (this.imageRef.nativeElement.height >= top || top >= 0) this.clickTargetTop.set(`${top}px`);

    const x = Math.round((event.layerX / this.imageRef.nativeElement.width) * 100);
    const y = Math.round((event.layerY / this.imageRef.nativeElement.height) * 100);

    const value = `${x},${y}`;
    this.responses.emit([{
      id: this.localParameters.variableId,
      status: 'VALUE_CHANGED',
      value: value,
      relevantForResponsesProgress: true
    }]);
  }

  // eslint-disable-next-line class-methods-use-this
  private createDefaultParameters(): InteractionFindOnImageParams {
    return {
      variableId: '',
      imageSource: '',
      text: '',
      size: 'SMALL'
    };
  }
}
