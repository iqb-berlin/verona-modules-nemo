import {
  Component, effect, input, OnDestroy, OnInit, output, signal
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
  templateUrl: 'media-player.component.html',
  imports: [LottieComponent],
  styleUrls: ['./media-player.component.scss']
})
export class MediaPlayerComponent implements OnInit, OnDestroy {
  player = input.required<HTMLAudioElement>();
  playerId = input<string>();
  isPlaying = input<boolean>(false);
  disabled = input<boolean>(false);

  hadInteraction = false;
  movingButton = signal(false);
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
        this.hadInteraction = true;
        this.movingButton.set(false);
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

    // wait for 10 sec before start the moving button animation
    setTimeout(() => {
      if (!this.hadInteraction) this.movingButton.set(true);
    }, 10000);
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
