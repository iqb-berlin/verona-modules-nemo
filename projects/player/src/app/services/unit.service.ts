import { Injectable, signal, effect } from '@angular/core';

import {
  AudioOptions,
  ContinueButtonEnum,
  FirstAudioOptionsParams,
  InteractionEnum, OpeningImageParams,
  UnitDefinition
} from '../models/unit-definition';
import { AudioService } from './audio.service';

@Injectable({
  providedIn: 'root'
})

export class UnitService {
  constructor(private audioService: AudioService) {
    effect(() => {
      if (!this._openingFlowActive() || !this.openingAudio()) return;

      const currentAudioId = this.audioService.audioId();
      const isPlaying = this.audioService.isPlaying();
      const playCount = this.audioService.playCount();

      if (currentAudioId === 'openingAudio' && !isPlaying && playCount >= 1) {
        this.audioEnded('openingAudio');
      }
    });
  }

  firstAudioOptions = signal<FirstAudioOptionsParams | undefined>(undefined);
  mainAudio = signal<AudioOptions | undefined>(undefined);
  backgroundColor = signal('#EEE');
  continueButton = signal<ContinueButtonEnum>('ALWAYS');
  interaction = signal<InteractionEnum | undefined>(undefined);
  parameters = signal<unknown>({});
  hasInteraction = signal(false);
  ribbonBars = signal<boolean>(false);
  disableInteractionUntilComplete = signal(false);
  openingImageParams = signal<OpeningImageParams | null>(null);
  /** Opening audio options used to drive <stars-audio> during the opening flow */
  openingAudio = signal<AudioOptions | undefined>(undefined);
  /** Opening flow is active: interactions and main audio hidden */
  private _openingFlowActive = signal<boolean>(false);
  openingFlowActive = this._openingFlowActive.asReadonly();
  /** Whether the opening image is currently presented */
  private _showOpeningImage = signal<boolean>(false);
  showOpeningImage = this._showOpeningImage.asReadonly();

  reset() {
    this.mainAudio.set(undefined);
    this.firstAudioOptions.set(undefined);
    this.backgroundColor.set('#EEE');
    this.continueButton.set('ALWAYS');
    this.interaction.set(undefined);
    this.parameters.set({});
    this.hasInteraction.set(false);
    this.ribbonBars.set(false);
    this.disableInteractionUntilComplete.set(false);
    this.openingImageParams.set(null);
    this.openingAudio.set(undefined);
    this._openingFlowActive.set(false);
    this._showOpeningImage.set(false);
  }

  setNewData(unitDefinition: unknown) {
    this.reset();
    const def = unitDefinition as UnitDefinition;
    const firstAudioOptions: FirstAudioOptionsParams = {};
    this.firstAudioOptions.set(def.firstAudioOptions || firstAudioOptions);
    this.hasInteraction.set(def.interactionType !== undefined || def.interactionParameters !== undefined);
    // Prepare main audio
    const realMainAudio: AudioOptions | undefined = def.mainAudio ?
      ({ ...def.mainAudio, audioId: 'mainAudio' } as AudioOptions) :
      undefined;
    // Backward compatibility for animateButton and firstClickLayer
    if (realMainAudio?.animateButton) {
      if (!this.firstAudioOptions()?.animateButton) {
        this.firstAudioOptions.set({ ...this.firstAudioOptions(), animateButton: realMainAudio.animateButton });
      }
    }
    if (realMainAudio?.firstClickLayer) {
      if (!this.firstAudioOptions()?.firstClickLayer) {
        this.firstAudioOptions.set({ ...this.firstAudioOptions(), firstClickLayer: realMainAudio.firstClickLayer });
      }
    }
    const pattern = /^#([a-f0-9]{3}|[a-f0-9]{6})$/i;
    if (def.backgroundColor && pattern.test(def.backgroundColor)) {
      this.backgroundColor.set(def.backgroundColor);
    }
    if (def.continueButtonShow) {
      this.continueButton.set(def.continueButtonShow);
    }
    if (def.interactionType) this.interaction.set(def.interactionType);
    if (def.interactionParameters) this.parameters.set(def.interactionParameters);
    if (def.ribbonBars) this.ribbonBars.set(def.ribbonBars);
    if (def.mainAudio?.disableInteractionUntilComplete) {
      this.disableInteractionUntilComplete.set(def.mainAudio.disableInteractionUntilComplete);
    }

    if (def.openingImage && def.openingImage.imageSource) {
      this.openingImageParams.set(def.openingImage);
      // start opening flow. If audio exists, wait for click; else show image directly
      this._openingFlowActive.set(true);
      this._showOpeningImage.set(false);
      if (!def.openingImage.audioSource) {
        // no opening audio, show image immediately then finish
        this.showImageThenFinish();
      } else {
        // Provide opening audio to the shared stars-audio component
        this.openingAudio.set({
          audioId: 'openingAudio',
          audioSource: def.openingImage.audioSource,
          maxPlay: 1,
          firstClickLayer: false,
          animateButton: false,
          disableInteractionUntilComplete: false
        } as AudioOptions);
      }
    } else {
      // No opening image
    }

    // Set the main audio (always available outside the opening flow)
    if (realMainAudio) this.mainAudio.set(realMainAudio);
  }

  private audioEnded(playerId: string) {
    if (playerId === 'openingAudio') {
      this.showImageThenFinish();
    }
  }

  private showImageThenFinish() {
    const openingImageParameters = this.openingImageParams();
    const duration = Number.isFinite(openingImageParameters?.presentationDurationMS as number) &&
    (openingImageParameters?.presentationDurationMS as number) > 0 ?
      (openingImageParameters?.presentationDurationMS as number) : 0;
    // Stop rendering opening audio
    this.openingAudio.set(undefined);
    this._showOpeningImage.set(true);
    if (duration === 0) {
      // no delay: immediately finish
      this._showOpeningImage.set(false);
      this._openingFlowActive.set(false);
      return;
    }
    setTimeout(() => {
      this._showOpeningImage.set(false);
      this._openingFlowActive.set(false);
    }, duration);
  }
}
