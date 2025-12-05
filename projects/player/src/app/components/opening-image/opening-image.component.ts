import {
  Component, effect, inject, signal
} from '@angular/core';
import { UnitService } from '../../services/unit.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'stars-opening-image',
  templateUrl: './opening-image.component.html',
  styleUrls: ['./opening-image.component.scss'],
  standalone: true,
  imports: []
})
export class OpeningImageComponent {
  unitService = inject(UnitService);
  audioService = inject(AudioService);

  /** local flag to show the image during the opening sequence */
  showImage = signal<boolean>(false);

  constructor() {
    // When opening flow starts
    effect(() => {
      if (!this.unitService.openingFlowActive()) return;
      const params = this.unitService.openingImageParams();
      if (!params) return;
      // If there is no opening audio, show image immediately and schedule finish based on duration
      if (!params.audioSource) {
        if (!this.showImage()) this.showImage.set(true);
        this.scheduleFinishAfterDuration();
      }
    });

    effect(() => {
      if (!this.unitService.openingFlowActive()) return;
      const params = this.unitService.openingImageParams();
      if (!params?.audioSource) return;

      const currentAudioId = this.audioService.audioId();
      const isPlaying = this.audioService.isPlaying();
      const playCount = this.audioService.playCount();

      // When opening audio finished, show image and schedule finish
      if (currentAudioId === 'openingAudio' && !isPlaying && playCount >= 1) {
        if (!this.showImage()) this.showImage.set(true);
        this.scheduleFinishAfterDuration();
      }
    });
  }

  private scheduleFinishAfterDuration() {
    const duration = Number(this.unitService.openingImageParams()?.presentationDurationMS || 0);
    if (!Number.isFinite(duration) || duration <= 0) {
      this.finishOpeningFlowAndStartMainAudio();
      return;
    }
    setTimeout(() => {
      this.finishOpeningFlowAndStartMainAudio();
    }, duration);
  }

  private finishOpeningFlowAndStartMainAudio() {
    // Close opening flow
    this.unitService.finishOpeningFlow();
    // After opening flow, disable the first click layer for the main audio
    const currentOpts = this.unitService.firstAudioOptions() || {};
    if (currentOpts.firstClickLayer) {
      this.unitService.firstAudioOptions.set({ ...currentOpts, firstClickLayer: false });
    }
    // Now that the opening image has disappeared, switch to main audio and auto-play once
    const main = this.unitService.mainAudio();
    if (main?.audioSource) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.audioService.setAudioSrc({ ...main, audioId: 'mainAudio' }).then(ready => {
        if (ready) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.audioService.getPlayFinished('mainAudio');
        }
      }).catch(err => {
        // eslint-disable-next-line no-console
        console.error('Failed to load main audio after opening image', err);
      });
    }
  }
}
