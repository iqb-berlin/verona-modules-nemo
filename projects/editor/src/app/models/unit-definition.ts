import { signal } from '@angular/core';

export type Json = Record<string, unknown>;

export interface WhiteList {
  firstAudioOptions?: {
    firstClickLayer: boolean,
    animateButton: boolean
  },
  ribbonBars?: boolean,
  backgroundColor?: string,
  continueButtonShow?: string,
  openingImage?: {
    audioSource: string,
    imageSource: string,
    imageUseFullArea: boolean,
    presentationDurationMS: number
  },
  mainAudio?: {
    audioSource: string,
    maxPlay: number,
    disableInteractionUntilComplete: boolean
  },
  interactionType: string,
  interactionMaxTimeMS?: number,
  interactionParameters?: {
    variableId: string,
    imageSource: string,
    imagePosition: string,
    imageLandingXY: string,
    text: string
  }
}

export const defaultModel = signal<WhiteList>({
  interactionType: 'click',
  backgroundColor: '#000'
});
