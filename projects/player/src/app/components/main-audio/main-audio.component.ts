import {
  Component, effect, ElementRef, inject, input, ViewChild
} from '@angular/core';
import { MediaPlayerComponent } from './media-player.component';
import { ClickLayerComponent } from './click-layer.component';
import { SafeResourceUrlPipe } from '../../pipes/safe-resource-url.pipe';
import { ResponsesService } from '../../services/responses.service';
import { MainAudio } from '../../models/unit-definition';

@Component({
  selector: 'stars-main-audio',
  template: `
    <div class="audio-instruction-container">
      @if (showLayer) {
        <stars-click-layer (click)="layerClicked()"></stars-click-layer>
      }
      <div class="audio-button-wrapper">
        <stars-media-player [player]="player"
                            [playerId]="playerId()"
                            [isPlaying]="isPlaying"
                            [disabled]="canPlay()"
                            (elementValueChanged)="valueChanged($event)">
          <audio #player
                 [src]="localAudio.audioSource | safeResourceUrl"
                 (play)="onPlay()"
                 (pause)="onPause()"
                 (ended)="onPause()">
          </audio>
          <label>
            Audio
          </label>
        </stars-media-player>
      </div>
    </div>
  `,
  imports: [
    MediaPlayerComponent,
    ClickLayerComponent,
    SafeResourceUrlPipe
  ],
  styleUrl: 'main-audio.component.css'
})

export class MainAudioComponent {
  mainAudio = input.required();
  localAudio:MainAudio | null = null;

  playerId = input.required<string>();
  maxPlays = input(0);

  showLayer = false;
  @ViewChild('player', { static: false }) audioElementRef!: ElementRef<HTMLAudioElement>;
  // @ViewChild('player', { static: false }) audioElement: HTMLAudioElement;

  private playCount: number = 0;
  isPlaying: boolean = false;
  responsesService = inject(ResponsesService);

  constructor() {
    effect(() => {
      this.localAudio = this.mainAudio() as MainAudio;

      if (this.localAudio) {
        if (this.audioElementRef) {
          this.audioElementRef.nativeElement.pause();
          this.audioElementRef.nativeElement.currentTime = 0;
        }
        this.localAudio.audioSource = this.localAudio.audioSource ?
          this.localAudio.audioSource : null;
        if (this.localAudio.firstClickLayer) this.showLayer = true;
        this.playCount = 0;
        this.isPlaying = false;
      }
    });
  }

  onPlay() {
    if (this.maxPlays() !== 0 && this.playCount >= this.maxPlays()) {
      this.audioElementRef?.nativeElement.pause();
      console.warn('Maximum play limit reached');
      return;
    }
    this.playCount += 1;
    this.isPlaying = true;
  }

  onPause() {
    this.isPlaying = false;
  }

  valueChanged(event) {
    console.log(`valueChanged ${this.playerId}`);
    console.log(event);
  }

  canPlay(): boolean {
    return true;
    //return this.maxPlays() === 0 || this.playCount < this.maxPlays();
  }

  layerClicked() {
    if (this.audioElementRef) this.audioElementRef.nativeElement.play();
    this.responsesService.firstInteractionDone.set(true);
    this.showLayer = false;
  }
}
