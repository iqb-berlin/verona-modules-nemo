import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class AudioService {
  private _audioElement: HTMLAudioElement | null = null;

  _audioId = signal<string>('audio');
  audioId = this._audioId.asReadonly();
  _maxPlay = signal<number>(0);
  maxPlay = this._maxPlay.asReadonly();
  _playCount = signal<number>(0);
  playCount = this._playCount.asReadonly();
  _isPlaying = signal<boolean>(false);
  isPlaying = this._isPlaying.asReadonly();

  playerStatus: BehaviorSubject<string> = new BehaviorSubject('paused');

  constructor() {
    this._audioElement = new Audio();
    this.attachListeners();
  }

  attachListeners() {
    if (this._audioElement === null) return;
    this._audioElement.addEventListener('playing', this.setPlayerStatus, false);
    this._audioElement.addEventListener('pause', this.setPlayerStatus, false);
    this._audioElement.addEventListener('ended', this.setPlayerStatus, false);
  }

  private setPlayerStatus = event => {
    switch (event.type) {
      case 'playing':
        this.playerStatus.next('playing');
        break;
      case 'pause':
        this._playCount.update(count => count + 1);
        this._isPlaying.set(false);
        this.playerStatus.next('paused');
        break;
      case 'ended':
        this._playCount.update(count => count + 1);
        this._isPlaying.set(false);
        this.playerStatus.next('ended');
        break;
      default:
        this.playerStatus.next('paused');
        break;
    }
  };

  getPlayerStatus(): Observable<string> {
    return this.playerStatus.asObservable();
  }

  play() {
    this._audioElement?.play();
    this._isPlaying.set(true);
  }

  pause() {
    this._audioElement?.pause();
    this._isPlaying.set(false);
  }

  setAudioSrc(src: string): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.getPlayerStatus().subscribe(status => {
          if (status === 'paused') {
            if (this._audioElement) this._audioElement.src = src;
            this._audioElement?.load();
            resolve(true);
          }
        });
      }, 50);
    });
  }

  getPlayFinished(): Promise<boolean> {
    this.play();
    return new Promise(resolve => {
      setTimeout(() => {
        this.getPlayerStatus().subscribe(status => {
          if (status === 'paused' && !this.isPlaying()) {
            resolve(true);
          }
        });
      }, 50);
    });
  }

  setAudioId(id: string) {
    this._audioId.set(id);
  }

  setMaxPlay(max: number) {
    this._maxPlay.set(max);
  }

  setPlayCount(count: number) {
    this._playCount.set(count);
  }
}
