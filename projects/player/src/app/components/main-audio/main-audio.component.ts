import {
  Component, effect, ElementRef, inject, input, signal, ViewChild
} from '@angular/core';

import { MediaPlayerComponent } from './media-player.component';
import { ClickLayerComponent } from './click-layer.component';
import { SafeResourceUrlPipe } from '../../pipes/safe-resource-url.pipe';
import { ResponsesService } from '../../services/responses.service';
import { MainAudio } from '../../models/unit-definition';

@Component({
  selector: 'stars-main-audio',
  templateUrl: 'main-audio.component.html',
  imports: [
    MediaPlayerComponent,
    ClickLayerComponent,
    SafeResourceUrlPipe
  ],
  styleUrl: 'main-audio.component.scss'
})

export class MainAudioComponent {
  mainAudio = input.required();
  localAudio:MainAudio | null = null;
  playerId = input.required<string>();

  showLayer = false;
  @ViewChild('audioPlayer', { static: false }) audioElementRef!: ElementRef<HTMLAudioElement>;
  playCount = signal(0);
  maxPlay = 0;
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
        // Show the first-click layer only if configured AND the main audio has not been completed
        this.showLayer = !!this.localAudio.firstClickLayer && !this.responsesService.mainAudioComplete();
        this.playCount.set(0);
        this.maxPlay = this.localAudio.maxPlay;
        this.isPlaying = false;
      }
    });
  }

  onPlay() {
    if (this.maxPlay !== 0 && this.playCount() >= this.maxPlay) {
      this.audioElementRef?.nativeElement.pause();
      console.warn('Maximum play limit reached');
      return;
    }
    this.playCount.set(this.playCount() + 1);
    this.isPlaying = true;
  }

  onPause() {
    this.isPlaying = false;
  }

  canPlay(): boolean {
    return this.maxPlay === 0 || this.playCount() < this.maxPlay;
  }

  layerClicked() {
    if (this.audioElementRef) this.audioElementRef.nativeElement.play();
    this.responsesService.firstInteractionDone.set(true);
    this.showLayer = false;
  }
}
