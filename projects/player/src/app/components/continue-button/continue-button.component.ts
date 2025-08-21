import {
  Component, ElementRef, EventEmitter, inject, Output, signal, ViewChild
} from '@angular/core';

import { ResponsesService } from '../../services/responses.service';
import { SafeResourceUrlPipe } from '../../pipes/safe-resource-url.pipe';

@Component({
  selector: 'stars-continue-button',
  standalone: true,
  templateUrl: 'continue-button.component.html',
  imports: [
    SafeResourceUrlPipe
  ],
  styleUrls: ['./continue-button.component.scss']
})

export class ContinueButtonComponent {
  @Output() navigate = new EventEmitter();
  responseService = inject(ResponsesService);
  clicked = signal(false);
  audioSource = signal('');
  isPlaying = signal(false);

  @ViewChild('buttonAudio', { static: false }) audioElementRef!: ElementRef<HTMLAudioElement>;
  lastAudioSource = '';

  handleClick() {
    if (this.isPlaying()) return;
    this.clicked.set(true);

    setTimeout(() => {
      this.clicked.set(false);
    }, 200);

    if (this.responseService.pendingAudioFeedback()) {
      const newAudioSource = this.responseService.getAudioFeedback(true);
      if (newAudioSource !== this.lastAudioSource) {
        this.audioSource.set(newAudioSource);

        setTimeout(() => {
          this.audioElementRef.nativeElement.play();
        }, 200);

        this.lastAudioSource = newAudioSource;
      } else {
        setTimeout(() => {
          this.navigate.emit();
        }, 200);
      }
    } else {
      setTimeout(() => {
        this.navigate.emit();
      }, 200);
    }
  }

  onPlay() {
    this.isPlaying.set(true);
  }

  onPause() {
    this.isPlaying.set(false);
  }
}
