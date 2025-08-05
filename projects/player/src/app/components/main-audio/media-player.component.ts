import {
  Component, effect, input, OnDestroy, OnInit, output
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import {
  fromEvent, Subject, tap, throttleTime
} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';

import { VeronaPostService } from '../../services/verona-post.service';
import { ResponsesService } from '../../services/responses.service';

@Component({
  selector: 'stars-media-player',
  template: `
    <div class="audio-button-container">
      <div class="custom-audio-button" (click)="play()">
        <img src="assets/images/ear-default.svg" class="speaker-icon">
      </div>
      <div class="audio-button-animation">
        <ng-lottie [options]="lottieOptions"
                   (animationCreated)="animationCreated($event)">
        </ng-lottie>
      </div>
    </div>
  `,
  imports: [LottieComponent],
  styleUrls: ['./media-player.component.scss']
})
export class MediaPlayerComponent implements OnInit, OnDestroy {
  player = input.required<HTMLAudioElement>();
  playerId = input<string>();
  image = input<string>();
  isPlaying = input<boolean>(false);
  disabled = input<boolean>(false);
  elementValueChanged = output();
  currentTime = 0;
  private ngUnsubscribe = new Subject<void>();
  animationItem: AnimationItem = null;

  lottieOptions: AnimationOptions = {
    path: '/assets/images/audio-animation.json',
    autoplay: false
  };

  constructor(
    private sanitizer: DomSanitizer,
    private veronaPostService: VeronaPostService,
    private responsesService: ResponsesService
  ) {
    effect(() => {
      if (this.isPlaying()) {
        this.animationItem?.play();
      } else {
        this.animationItem?.pause();
      }
    });
  }

  ngOnInit() {
    fromEvent(this.player(), 'timeupdate')
      .pipe(
        takeUntil(this.ngUnsubscribe),
        tap(() => {
          this.currentTime = this.player().currentTime / 60;
        }),
        throttleTime(100)
      )
      .subscribe(() => this.sendPlaybackTimeChanged());
  }

  ngOnDestroy() {
    this.pause();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  play(): void {
    this.player()
      .play()
      .then(() => this.sendPlaybackTimeChanged());

    this.animationItem?.play();
  }

  pause(): void {
    this.sendPlaybackTimeChanged();
    this.player().pause();

    this.animationItem?.pause();
  }

  animationCreated(animationItem: AnimationItem): void {
    this.animationItem = animationItem;
  }

  sendPlaybackTimeChanged(): void {
    this.responsesService.newResponses([{
      id: this.playerId(),
      value: this.player().currentTime,
      status: 'VALUE_CHANGED'
    }]);
  }
}
