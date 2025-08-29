import {
  Component, effect, ElementRef, signal, ViewChild
} from '@angular/core';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionFindOnImageParams } from '../../models/unit-definition';

@Component({
  selector: 'stars-interaction-find-on-image',
  templateUrl: './find-on-image.component.html',
  standalone: true,
  styleUrls: ['./find-on-image.component.scss']
})

export class InteractionFindOnImageComponent extends InteractionComponentDirective {
  localParameters: InteractionFindOnImageParams;
  clickTargetTop = signal('0px');
  clickTargetLeft = signal('0px');

  @ViewChild('imageElement', { static: false }) imageRef!: ElementRef<HTMLImageElement>;
  buttonDisabled = signal(true);
  showAreaStyle = signal('');

  constructor() {
    super();

    effect(() => {
      const parameters = this.parameters() as InteractionFindOnImageParams;
      this.localParameters = this.createDefaultParameters();
      this.buttonDisabled.set(true);
      if (parameters) {
        this.localParameters.variableId = parameters.variableId || 'FIND_ON_IMAGE';
        this.localParameters.imageSource = parameters.imageSource || '';
        this.localParameters.text = parameters.text || '';
        this.localParameters.showArea = parameters.showArea || '';
        this.localParameters.size = parameters.size || 'SMALL';
        if (this.localParameters.showArea) {
          const area = this.localParameters.showArea.match(/\d+/g);
          const imgWidth = this.imageRef.nativeElement.width;
          const imgHeight = this.imageRef.nativeElement.height;
          const imgTop = this.imageRef.nativeElement.offsetTop;
          const imgLeft = this.imageRef.nativeElement.offsetLeft;

          const x1 = Math.round((Number.parseInt(area[0], 10) * (imgWidth / 100)) + imgLeft);
          const y1 = Math.round((Number.parseInt(area[1], 10) * (imgHeight / 100)) + imgTop);
          const x2 = Math.round((Number.parseInt(area[2], 10) * (imgWidth / 100)) + imgLeft);
          const y2 = Math.round((Number.parseInt(area[3], 10) * (imgHeight / 100)) + imgTop);
console.log(`x1: ${x1} y1: ${y1} x2: ${x2} y2: ${y2}`);
          this.showAreaStyle.set(`top: ${y1}px; left: ${x1}px; width: ${x2 - x1}px; height: ${y2 - y1}px;`);
        }
        this.responses.emit([{
          id: this.localParameters.variableId,
          status: 'DISPLAYED',
          value: '',
          relevantForResponsesProgress: false
        }]);
      }
    });
  }

  onClick(event) {
    this.clickTargetLeft.set(`${event.layerX}px`);
    this.clickTargetTop.set(`${event.layerY}px`);
    if (this.buttonDisabled()) this.buttonDisabled.set(false);

    const imgWidth = this.imageRef.nativeElement.width;
    const imgHeight = this.imageRef.nativeElement.height;
    const imgTop = this.imageRef.nativeElement.offsetTop;
    const imgLeft = this.imageRef.nativeElement.offsetLeft;
    const x = Math.round(((event.layerX - imgLeft) / imgWidth) * 100);
    const y = Math.round(((event.layerY - imgTop) / imgHeight) * 100);

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
      showArea: '',
      size: 'SMALL'
    };
  }
}
