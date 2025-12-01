import {
  Component, effect, inject, signal
} from '@angular/core';
import { UnitService } from '../../services/unit.service';
import { AudioService } from '../../services/audio.service';
import { AudioOptions } from '../../models/unit-definition';
import { AudioComponent } from '../audio/audio.component';

@Component({
  selector: 'stars-opening-image',
  templateUrl: './opening-image.component.html',
  styleUrls: ['./opening-image.component.scss'],
  standalone: true,
  imports: [AudioComponent]
})
export class OpeningImageComponent {
  unitService = inject(UnitService);
  audioService = inject(AudioService);

  // local audio options to drive <stars-audio> for the opening sequence
  openingAudio = signal<AudioOptions | undefined>(undefined);
  // local flag to show the image during the opening sequence
  showImage = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (!this.unitService.openingFlowActive()) return;
      const params = this.unitService.openingImageParams();
      if (!params) return;

      if (this.showImage()) return;

      if (params.audioSource) {
        // Set up opening audio and wait for it to finish
        this.openingAudio.set({
          audioId: 'openingAudio',
          audioSource: params.audioSource,
          maxPlay: 1,
          firstClickLayer: false,
          animateButton: false,
          disableInteractionUntilComplete: false
        });
      } else {
        // No audio: show the image immediately and schedule finish
        this.transitionToImage();
      }
    });

    // Watch the shared audio player to detect when the opening audio finished
    effect(() => {
      if (!this.unitService.openingFlowActive() || !this.openingAudio()) return;
      const currentAudioId = this.audioService.audioId();
      const isPlaying = this.audioService.isPlaying();
      const playCount = this.audioService.playCount();
      if (currentAudioId === 'openingAudio' && !isPlaying && playCount >= 1) {
        this.transitionToImage();
      }
    });
  }

  private transitionToImage() {
    // show image and plan finish according to duration
    this.showImage.set(true);
    const duration = Number(this.unitService.openingImageParams()?.presentationDurationMS || 0);
    if (!Number.isFinite(duration) || duration <= 0) {
      this.unitService.finishOpeningFlow();
      return;
    }
    setTimeout(() => {
      this.unitService.finishOpeningFlow();
    }, duration);
  }
}
