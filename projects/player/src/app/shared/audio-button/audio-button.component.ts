import {
  Component, inject, input, output
} from '@angular/core';

import { AudioService } from '../../services/audio.service';
import { AudioOptions } from '../../models/unit-definition';

@Component({
  selector: 'stars-audio-button',
  templateUrl: 'audio-button.component.html',
  styleUrl: 'audio-button.component.scss'
})

export class AudioButtonComponent {
  audio = input.required<AudioOptions>();
  elementValueChanged = output();

  audioService = inject(AudioService);

  play() {
    if (this.audio().audioSource && this.audio().audioId) {
      this.audioService.setAudioSrc(this.audio()).then(() => {
        this.audioService.getPlayFinished(this.audio().audioId)
          .then(resolve => {
          });
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  disabled() {
    return false;
  }
}
