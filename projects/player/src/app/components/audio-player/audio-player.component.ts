import {
  Component, ElementRef, input, output, signal, ViewChild
} from '@angular/core';

import { SafeResourceUrlPipe } from '../../pipes/safe-resource-url.pipe';
import { StarsResponse } from '../../services/responses.service';

@Component({
  selector: 'stars-audio-player',
  templateUrl: 'audio-player.component.html',
  imports: [
    SafeResourceUrlPipe
  ],
  styleUrl: 'audio-player.component.scss'
})

export class MainAudioComponent {
  audioSrc = input.required();
  playerId = input.required<string>();
  maxPlay = input(0);
  formerState = input<Response[]>();
  responses = output<StarsResponse[]>();

  // @ts-expect-error playerId is required so will be defined
  @ViewChild(this.playerId(), { static: false }) audioElementRef!: ElementRef<HTMLAudioElement>;
  playCount = signal(0);
  isPlaying: boolean = false;

  onPlay() {
    if (this.maxPlay() !== 0 && this.playCount() >= this.maxPlay()) {
      this.audioElementRef?.nativeElement.pause();
      return;
    }
    this.playCount.set(this.playCount() + 1);
    this.isPlaying = true;
  }

  onPause() {
    this.isPlaying = false;
  }
}
