import {
  Component, effect, input, OnDestroy, OnInit, output
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
        <div [innerHTML]="audioIconSvg" class="speaker-icon"></div>
      </div>
      <div class="audio-button-animation" [class.playing]="isPlaying()">
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
  isPlaying = input<boolean>(false);
  disabled = input<boolean>(false);
  elementValueChanged = output();
  currentTime = 0;
  private ngUnsubscribe = new Subject<void>();
  animationItem: AnimationItem = null;

  private staticSvg = `
   <svg width="70" height="70" viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
        <rect class="white-circle" x="0" y="0" width="70" height="70" rx="70" fill="white"/>
        <g transform="translate(-3, -3)">
            <path d="M27.6744 25.0836C28.301 24.2986 28.3101 23.1534 27.601 22.4421C26.8888 21.7278 25.7247 21.723 25.0803 22.4989C22.1911 25.9773 20.4541 30.4532 20.4541 35.3399C20.4541 40.2266 22.1911 44.7024 25.0803 48.1808C25.7247 48.9567 26.8888 48.9518 27.6009 48.2376C28.3101 47.5263 28.3009 46.381 27.6743 45.5961C25.4301 42.7848 24.0915 39.2193 24.0915 35.34C24.0915 31.4606 25.4303 27.8949 27.6744 25.0836Z" fill="#101C61"/>
            <path d="M45.9163 55.4059C45.398 55.4059 44.8887 55.2965 44.525 55.1322C43.2428 54.4481 42.3152 53.5179 41.4149 50.7815C40.4783 47.945 38.7414 46.6042 37.059 45.2999C35.6223 44.1871 34.1309 43.0378 32.8487 40.6937C31.8938 38.9426 31.3665 37.0361 31.3665 35.3398C31.3665 30.2229 35.3586 26.2188 40.4601 26.2188C44.9426 26.2188 48.5687 29.3101 49.3826 33.5314C49.5728 34.5177 50.3681 35.3398 51.3726 35.3398C52.377 35.3398 53.2047 34.521 53.0693 33.5257C52.2158 27.2546 46.9835 22.5704 40.4602 22.5704C33.3217 22.5704 27.729 28.1798 27.729 35.3398C27.729 37.6475 28.4201 40.1739 29.6659 42.4541C31.321 45.4731 33.2762 46.9781 34.8493 48.2002C36.3225 49.3404 37.3864 50.1614 37.9684 51.9307C39.0596 55.2418 40.4691 57.1113 42.9245 58.4065C43.8702 58.8352 44.8705 59.0543 45.9163 59.0543C49.3074 59.0543 52.1653 56.7128 52.967 53.5578C53.2144 52.5843 52.3769 51.7574 51.3725 51.7574C50.368 51.7574 49.5916 52.62 49.1118 53.5025C48.4951 54.6367 47.2957 55.4059 45.9163 55.4059Z" fill="#101C61"/>
            <path d="M46.013 35.3879C39.3769 36.1719 41.499 45.5537 47.7555 44.6763" fill="#101C61"/>
        </g>
    </svg>`;

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

  get audioIconSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.staticSvg);
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
