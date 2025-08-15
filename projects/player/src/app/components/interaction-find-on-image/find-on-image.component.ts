import {
  AfterViewInit,
  Component, effect, ElementRef, OnInit, signal, ViewChild
} from '@angular/core';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionFindOnImageParams } from '../../models/unit-definition';

@Component({
  selector: 'stars-interaction-find-on-image',
  templateUrl: './find-on-image.component.html',
  styleUrls: ['./find-on-image.component.scss']
})

export class InteractionFindOnImageComponent extends InteractionComponentDirective implements OnInit, AfterViewInit {
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
      if (parameters) {
        this.localParameters.variableId = parameters.variableId || 'FIND_ON_IMAGE';
        this.localParameters.imageSource = parameters.imageSource || '';
        this.localParameters.text = parameters.text || '';
        this.localParameters.showArea = parameters.showArea || '';
        this.localParameters.size = parameters.size || 'SMALL';
      }
    });
  }

  ngOnInit() {
    this.responses.emit([{
      // @ts-expect-error access parameter of unknown
      id: this.parameters().variableId || 'FIND_ON_IMAGE',
      status: 'DISPLAYED',
      value: '',
      relevantForResponsesProgress: false
    }]);
  }

  ngAfterViewInit() {
    if (this.localParameters?.showArea) {
      const area = this.localParameters.showArea.match(/\d+/g);

      const xMultiplier = this.imageRef.nativeElement.width / 100;
      const yMultiplier = this.imageRef.nativeElement.height / 100;

      const x1 = Math.round(Number.parseInt(area[0], 10) * xMultiplier);
      const y1 = Math.round(Number.parseInt(area[1], 10) * yMultiplier);
      const x2 = Math.round(Number.parseInt(area[2], 10) * xMultiplier);
      const y2 = Math.round(Number.parseInt(area[3], 10) * yMultiplier);

      this.showAreaStyle.set(`top: ${y1}px; left: ${x1}px; width: ${x2 - x1}px; height: ${y2 - y1}px;`);
    }
  }

  onClick(event) {
    if (this.buttonDisabled()) this.buttonDisabled.set(false);

    this.clickTargetLeft.set(`${event.layerX}px`);
    this.clickTargetTop.set(`${event.layerY}px`);

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
      showArea: '',
      size: 'SMALL'
    };
  }
}
