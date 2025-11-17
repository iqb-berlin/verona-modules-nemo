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
  private started = false;

  constructor() {
    effect(() => {
      const openingImageParameters = this.unitService.openingImageParams();
      this.parameters.set(openingImageParameters);
      if (!openingImageParameters || this.started) return;

      const trigger = (openingImageParameters.startTrigger || 'UNIT_START').toUpperCase();
      const delay = openingImageParameters.startDelayMS ?? 0;
      const duration = openingImageParameters.presentationDurationMS ?? 0;

      if (trigger === 'UNIT_START') {
        this.started = true;
        this.unitService.startOpeningImage(delay, duration);
      } else if (trigger === 'MAIN_AUDIO_END') {
        // Read dependency so effect re-runs when main audio completes
        const mainDone = this.responsesService.mainAudioComplete();
        if (mainDone && !this.started) {
          this.started = true;
          this.unitService.startOpeningImage(delay, duration);
        }
      }
    });
  }

  shouldShowStartButton(): boolean {
    const p = this.parameters();
    if (!p) return false;
    const trigger = (p.startTrigger || 'UNIT_START').toUpperCase();
    // show button only while opening flow is active and before started
    return trigger === 'START_BUTTON' && this.unitService.openingFlowActive() && !this.started;
  }

  startByButton() {
    if (this.started) return;
    this.started = true;
    const p = this.parameters();
    const delay = p?.startDelayMS ?? 0;
    const duration = p?.presentationDurationMS ?? 0;
    this.unitService.startOpeningImage(delay, duration);
  }
}
