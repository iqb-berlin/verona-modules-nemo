import { Injectable, signal } from '@angular/core';
import { form } from '@angular/forms/signals';

import {
  AudioOptions,
  ContinueButtonEnum,
  FirstAudioOptionsParams,
  InteractionEnum,
  InteractionParameters,
  OpeningImageParams
} from '../../../../player/src/app/models/unit-definition';
import { defaultModel } from '../models/unit-definition';

@Injectable({
  providedIn: 'root'
})

export class UnitService {
  backgroundColor = signal('#EEE');
  ribbonBars = signal<boolean>(false);
  firstAudioOptions = signal<FirstAudioOptionsParams | undefined>(undefined);
  continueButtonShow = signal<ContinueButtonEnum>('NO');
  openingImage = signal<OpeningImageParams | null>(null);
  mainAudio = signal<AudioOptions | undefined>(undefined);
  interactionType = signal<InteractionEnum | undefined>(undefined);
  interactionMaxTimeMS = signal<number>(0);
  interactionParameters = signal<InteractionParameters | undefined>(undefined);

  form = form(defaultModel);
}
