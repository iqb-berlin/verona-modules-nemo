import {
  Component, effect, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnitService } from '../../services/unit.service';
import { ResponsesService } from '../../services/responses.service';
import { OpeningImageParams } from '../../models/unit-definition';

@Component({
  selector: 'stars-opening-image',
  templateUrl: './opening-image.component.html',
  styleUrls: ['./opening-image.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class OpeningImageComponent {
  unitService = inject(UnitService);
  responsesService = inject(ResponsesService);

  parameters = signal<OpeningImageParams | null>(null);
  /** Whether the opening audio has been started */
  private started = false;
  /** Whether the delay timer has elapsed */
  private delayElapsed = signal(false);

  constructor() {
    // Effect 1: react to new parameters, (re)start delay timer from unit load
    effect(() => {
      const openingImageParameters = this.unitService.openingImageParams();
      this.parameters.set(openingImageParameters);
      // reset local state on new data
      this.started = false;
      this.delayElapsed.set(false);
      if (!openingImageParameters) return;
      const delay = openingImageParameters.startDelayMS ?? 0;
      if (Number.isFinite(delay) && delay > 0) {
        setTimeout(() => this.delayElapsed.set(true), delay);
      } else {
        this.delayElapsed.set(true);
      }
    });

    // Effect 2: evaluate start trigger conditions
    effect(() => {
      const openingImageParameters = this.parameters();
      if (!openingImageParameters || this.started === true) return;
      const trigger = (openingImageParameters.startTrigger || 'UNIT_START').toUpperCase();
      const canStartNow = this.delayElapsed();
      if (!canStartNow) return;

      if (trigger === 'UNIT_START') {
        this.started = true;
        this.unitService.startOpeningAudio();
      } else if (trigger === 'MAIN_AUDIO_END') {
        const mainAudioDone = this.responsesService.mainAudioComplete();
        if (mainAudioDone) {
          this.started = true;
          this.unitService.startOpeningAudio();
        }
      }
      // START_BUTTON handled by UI when delay has elapsed
    });
  }

  shouldShowStartButton(): boolean {
    const openingImageParameters = this.parameters();
    if (!openingImageParameters) return false;
    const trigger = (openingImageParameters.startTrigger || 'UNIT_START').toUpperCase();
    // show button only while opening flow is active and before started
    return trigger === 'START_BUTTON' && this.unitService.openingFlowActive() && !this.started && this.delayElapsed();
  }

  startByButton() {
    if (this.started) return;
    this.started = true;
    this.unitService.startOpeningAudio();
  }
}
