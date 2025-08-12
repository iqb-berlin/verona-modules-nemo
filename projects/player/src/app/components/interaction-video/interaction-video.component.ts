import {
  AfterViewInit, Component, effect, ElementRef, signal, ViewChild
} from '@angular/core';
import {
  fromEvent, Subject, tap, throttleTime
} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Response } from '@iqbspecs/response/response.interface';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionVideoParams } from '../../models/unit-definition';

@Component({
  selector: 'stars-interaction-video',
  templateUrl: './interaction-video.component.html',
  styleUrls: ['./interaction-video.component.scss']
})

export class InteractionVideoComponent extends InteractionComponentDirective implements AfterViewInit {
  localParameters: InteractionVideoParams;
  playing = signal(false);

  playCount = 0;
  currentTime = 0;
  @ViewChild('videoPlayer', { static: false }) videoPlayerRef!: ElementRef<HTMLVideoElement>;
  private ngUnsubscribe = new Subject();

  constructor() {
    super();

    effect(() => {
      const parameters = this.parameters() as InteractionVideoParams;
      this.localParameters = this.createDefaultParameters();

      if (parameters) {
        this.localParameters.imageSource = parameters.imageSource || null;
        this.localParameters.videoSource = parameters.videoSource || null;
        this.localParameters.text = parameters.text || '';
        this.localParameters.variableId = parameters.variableId || 'videoPlayer';

        this.playing.set(false);
      }
    });
  }

  ngAfterViewInit() {
    if (this.videoPlayerRef) {
      fromEvent(this.videoPlayerRef?.nativeElement, 'timeupdate')
        .pipe(
          takeUntil(this.ngUnsubscribe),
          tap(() => {
            this.currentTime = this.videoPlayerRef.nativeElement.currentTime;
          }),
          throttleTime(100)
        )
        .subscribe(() => this.sendPlaybackTimeChanged());
    }
  }

  play() {
    this.videoPlayerRef.nativeElement
      .play()
      .then(() => {
        this.playing.set(true);
      });
  }

  ended() {
    this.playing.set(false);

    this.playCount += 1;

    this.sendPlaybackTimeChanged();
  }

  sendPlaybackTimeChanged(): void {
    let videoValue = 0;
    if (this.videoPlayerRef.nativeElement.duration) {
      videoValue = this.currentTime / this.videoPlayerRef.nativeElement.duration;
    }

    videoValue += this.playCount;

    const response: Response = {
      id: 'videoPlayer',
      value: videoValue,
      status: 'VALUE_CHANGED'
    };

    this.responses.emit([response]);
  }

  // eslint-disable-next-line class-methods-use-this
  private createDefaultParameters(): InteractionVideoParams {
    return {
      variableId: 'videoPlayer',
      imageSource: null,
      videoSource: null,
      text: ''
    };
  }
}
