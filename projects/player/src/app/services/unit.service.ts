import { Injectable, signal } from '@angular/core';
import { AudioService } from './audio.service';

import {
  AudioOptions,
  ContinueButtonEnum,
  FirstAudioOptionsParams,
  InteractionEnum, OpeningImageParams,
  UnitDefinition
} from '../models/unit-definition';

export enum MainPlayerStatus {
  PAUSED = 'PAUSED',
  PLAYING = 'PLAYING', // audio waves can be shown
  ENDED = 'ENDED',
  READY = 'READY',
  HIDE = 'HIDE'
}

@Injectable({
  providedIn: 'root'
})

export class UnitService {
  firstAudioOptions = signal<FirstAudioOptionsParams | undefined>(undefined);
  mainAudio = signal<AudioOptions | undefined>(undefined);
  backgroundColor = signal('#EEE');
  continueButton = signal<ContinueButtonEnum>('NO');
  interaction = signal<InteractionEnum | undefined>(undefined);
  parameters = signal<unknown>({});
  hasInteraction = signal(false);
  ribbonBars = signal<boolean>(false);
  disableInteractionUntilComplete = signal(false);
  openingImageParams = signal<OpeningImageParams | null>(null);
  /** To hide the speaker icon when imageSource inside openingImage is being shown */
  showingOpeningImage = signal<boolean>(false);
  /** Opening flow is active: interactions and main audio hidden */
  private _openingFlowActive = signal<boolean>(false);
  openingFlowActive = this._openingFlowActive.asReadonly();

  /** Player button status: ready, paused, playing, ended, hide */
  playerButtonStatus = signal<MainPlayerStatus>(MainPlayerStatus.HIDE);

  constructor(private audioService: AudioService) {
  }

  // Public helpers for OpeningImageComponent
  startOpeningFlow(params: OpeningImageParams = {} as OpeningImageParams) {
    this.openingImageParams.set(params);
    this._openingFlowActive.set(true);
  }

  finishOpeningFlow() {
    this._openingFlowActive.set(false);
  }

  reset() {
    this.mainAudio.set(undefined);
    this.firstAudioOptions.set(undefined);
    this.backgroundColor.set('#EEE');
    this.continueButton.set('NO');
    this.interaction.set(undefined);
    this.parameters.set({});
    this.hasInteraction.set(false);
    this.ribbonBars.set(false);
    this.disableInteractionUntilComplete.set(false);
    this.openingImageParams.set(null);
    this.showingOpeningImage.set(false);
    this._openingFlowActive.set(false);
    this.playerButtonStatus.set(MainPlayerStatus.HIDE);
  }

  setNewData(unitDefinition: unknown) {
    this.reset();
    const def = unitDefinition as UnitDefinition;
    const firstAudioOptions: FirstAudioOptionsParams = {};
    this.firstAudioOptions.set(def.firstAudioOptions || firstAudioOptions);
    this.hasInteraction.set(def.interactionType !== undefined || def.interactionParameters !== undefined);
    // add audioId to the mainAudio object to be able to use it in audioService.setAudioSrc()
    const mainAudio: AudioOptions | undefined = def.mainAudio ?
      ({ ...def.mainAudio, audioId: 'mainAudio' } as AudioOptions) :
      undefined;
    // Backward compatibility for animateButton and firstClickLayer
    if (mainAudio?.animateButton) {
      if (!this.firstAudioOptions()?.animateButton) {
        this.firstAudioOptions.set({ ...this.firstAudioOptions(), animateButton: mainAudio.animateButton });
      }
    }
    if (mainAudio?.firstClickLayer) {
      if (!this.firstAudioOptions()?.firstClickLayer) {
        this.firstAudioOptions.set({ ...this.firstAudioOptions(), firstClickLayer: mainAudio.firstClickLayer });
      }
    }
    const pattern = /^#([a-f0-9]{3}|[a-f0-9]{6})$/i;
    if (def.backgroundColor && pattern.test(def.backgroundColor)) {
      this.backgroundColor.set(def.backgroundColor);
    }
    if (def.continueButtonShow) {
      this.continueButton.set(def.continueButtonShow);
    } else {
      this.continueButton.set('ALWAYS');
    }
    if (def.interactionType) this.interaction.set(def.interactionType);
    if (def.interactionParameters) this.parameters.set(def.interactionParameters);
    if (def.ribbonBars) this.ribbonBars.set(def.ribbonBars);
    if (def.mainAudio?.disableInteractionUntilComplete) {
      this.disableInteractionUntilComplete.set(def.mainAudio.disableInteractionUntilComplete);
    }

    if (def.openingImage && def.openingImage.imageSource) {
      this.startOpeningFlow(def.openingImage);
    }

    if (mainAudio) this.mainAudio.set(mainAudio);

    const openingAudioSource = def.openingImage?.audioSource?.trim();
    const openingParams = def.openingImage;
    if (openingAudioSource && openingParams) {
      this.audioService
        .setAudioSrc({ audioId: 'openingAudio', audioSource: openingAudioSource } as AudioOptions)
        // eslint-disable-next-line consistent-return
        .then(() => {
          this.openingImageParams.set(openingParams);
          this.playerButtonStatus.set(MainPlayerStatus.READY);
        })
        .catch(err => {
          // eslint-disable-next-line no-console
          console.error('AudioService.setAudioSrc failed for openingAudio:', err);
        });
    } else if (mainAudio?.audioSource) {
      this.audioService
        .setAudioSrc(mainAudio)
        // eslint-disable-next-line consistent-return
        .then(() => {
          this.playerButtonStatus.set(MainPlayerStatus.READY);
        })
        .catch(err => {
          // eslint-disable-next-line no-console
          console.error('AudioService.setAudioSrc failed for mainAudio:', err);
        });
    }
  }
}
