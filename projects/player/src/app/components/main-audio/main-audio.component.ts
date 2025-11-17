import {
  Component, effect, ElementRef, inject, input, signal, ViewChild
} from '@angular/core';

import { MediaPlayerComponent } from './media-player.component';
import { ClickLayerComponent } from './click-layer.component';
import { SafeResourceUrlPipe } from '../../pipes/safe-resource-url.pipe';
import { ResponsesService } from '../../services/responses.service';
import { MainAudio } from '../../models/unit-definition';
import { UnitService } from '../../services/unit.service';

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
  unitService = inject(UnitService);

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

        // Auto-play for opening intro audio (uses separate playerId)
        if (this.unitService.currentPlayerId() === 'openingAudio' && this.audioElementRef) {
          // slight delay to ensure element is ready
          setTimeout(() => {
            // attempt autoplay; browsers may block, but tests should allow data URLs
            this.audioElementRef.nativeElement.play().catch(() => {/* ignore */});
          }, 0);
        }
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

  onEnded() {
    // Notify UnitService so it can manage opening intro flow audio override end
    this.unitService.audioEnded(this.playerId());
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
