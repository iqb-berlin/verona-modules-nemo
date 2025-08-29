import {
  AfterViewInit,
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

export class InteractionFindOnImageComponent extends InteractionComponentDirective implements AfterViewInit {
  localParameters: InteractionFindOnImageParams;
  pendingShowArea = false;
  clickTargetTop = signal('0px');
  clickTargetLeft = signal('0px');
  clickTargetSize = signal('0px');

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
          if (this.imageRef) {
            this.setShowArea();
          } else {
            this.pendingShowArea = true;
          }
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

  ngAfterViewInit() {
    if (this.pendingShowArea) this.setShowArea();
  }

  setShowArea() {
    const area = this.localParameters.showArea.match(/\d+/g);
    const imgWidthFactor = this.imageRef.nativeElement.width / 100;
    const imgHeightFactor = this.imageRef.nativeElement.height / 100;
    const imgTop = this.imageRef.nativeElement.offsetTop;
    const imgLeft = this.imageRef.nativeElement.offsetLeft;

    const x1 = Math.round((Number.parseInt(area[0], 10) * imgWidthFactor) + imgLeft);
    const y1 = Math.round((Number.parseInt(area[1], 10) * imgHeightFactor) + imgTop);
    const x2 = Math.round((Number.parseInt(area[2], 10) * imgWidthFactor) + imgLeft);
    const y2 = Math.round((Number.parseInt(area[3], 10) * imgHeightFactor) + imgTop);
    this.showAreaStyle.set(`top: ${y1}px; left: ${x1}px; width: ${x2 - x1}px; height: ${y2 - y1}px;`);
  }

  setClickVisualisationAbsolute(x: number, y: number, imageWidth: number) {
    this.clickTargetLeft.set(`${x}px`);
    this.clickTargetTop.set(`${y}px`);
    let sizeFactor = 5;
    if (this.localParameters.size !== 'SMALL') sizeFactor = this.localParameters.size === 'LARGE' ? 15 : 10;
    this.clickTargetSize.set(`${sizeFactor * (imageWidth / 100)}px`);
    if (this.buttonDisabled()) this.buttonDisabled.set(false);
  }

  onClick(event) {
    const imgWidth = this.imageRef.nativeElement.width;
    this.setClickVisualisationAbsolute(event.layerX, event.layerY, imgWidth);
    const imgHeight = this.imageRef.nativeElement.height;
    const imgTop = this.imageRef.nativeElement.offsetTop;
    const imgLeft = this.imageRef.nativeElement.offsetLeft;
    const x = Math.round(((event.clientX - imgLeft) / imgWidth) * 100);
    const y = Math.round(((event.clientY - imgTop) / imgHeight) * 100);

    this.responses.emit([{
      id: this.localParameters.variableId,
      status: 'VALUE_CHANGED',
      value: `${x},${y}`,
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
