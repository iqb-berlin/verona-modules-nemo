import { Injectable, signal } from '@angular/core';

import { Subscription } from 'rxjs';
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
  constructor(private audioService: AudioService) {}

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
  /** Prevent double-start of opening audio */
  private openingAudioStarted = false;
  /** Subscription for tracking the shared audio service to detect end of opening audio */
  private openingAudioSub?: Subscription;

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
    this.openingAudioStarted = false;
    this.teardownOpeningAudioWatcher();
  }

  setNewData(unitDefinition: unknown) {
    this.reset();
    const def = unitDefinition as UnitDefinition;
    const firstAudioOptions: FirstAudioOptionsParams = {};
    this.firstAudioOptions.set(def.firstAudioOptions || firstAudioOptions);
    this.hasInteraction.set(def.interactionType !== undefined || def.interactionParameters !== undefined);
    // add audioId to mainAudio object to be able to use it in audioService.setAudioSrc()
    if (def.mainAudio) this.mainAudio.set({ ...def.mainAudio, audioId: 'mainAudio' } as AudioOptions);
    // Backward compatibility for animateButton and firstClickLayer
    if (this.mainAudio()?.animateButton) {
      if (!this.firstAudioOptions()?.animateButton) {
        this.firstAudioOptions.set({ ...this.firstAudioOptions(), animateButton: this.mainAudio().animateButton });
      }
    }
    if (this.mainAudio()?.firstClickLayer) {
      if (!this.firstAudioOptions()?.firstClickLayer) {
        this.firstAudioOptions.set({ ...this.firstAudioOptions(), firstClickLayer: this.mainAudio().firstClickLayer });
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
      this.openingAudioStarted = false;
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
        this.startOpeningAudioWatcher();
      }
    }
  }

  audioEnded(playerId: string) {
    if (playerId === 'openingAudio') {
      this.showImageThenFinish();
    }
  }

  private showImageThenFinish() {
    const openingImageParameters = this.openingImageParams();
    const duration = Number.isFinite(openingImageParameters?.presentationDurationMS as number) &&
    (openingImageParameters?.presentationDurationMS as number) > 0 ?
      (openingImageParameters?.presentationDurationMS as number) : 0;
    // Stop rendering opening audio and stop watching
    this.openingAudio.set(undefined);
    this.teardownOpeningAudioWatcher();
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

  /** Start watching the shared audio player to detect the end of opening audio playback */
  private startOpeningAudioWatcher() {
    this.teardownOpeningAudioWatcher();
    this.openingAudioSub = this.audioService.getPlayerStatus().subscribe(status => {
      if (!this.openingFlowActive() || !this.openingAudio()) return;
      if (this.audioService.audioId() !== 'openingAudio') return;
      if (status !== 'playing' && this.audioService.playCount() >= 1) {
        this.audioEnded('openingAudio');
      }
    });
  }

  private teardownOpeningAudioWatcher() {
    if (this.openingAudioSub) {
      this.openingAudioSub.unsubscribe();
      this.openingAudioSub = undefined;
    }
  }
}
