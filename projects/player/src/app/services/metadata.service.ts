import { Inject, Injectable, DOCUMENT } from '@angular/core';

import { VopMetaData } from '../models/verona';

@Injectable({
  providedIn: 'root'
})

export class MetadataService {
  playerMetadata!: VopMetaData;
  resourceURL: string | undefined;

  constructor(@Inject(DOCUMENT) private document: Document) {
    const playerMetadata: string | null | undefined = document.getElementById('meta_data')?.textContent;
    if (playerMetadata) {
      this.playerMetadata = JSON.parse(playerMetadata);
    }
  }

  getResourceURL(): string {
    return this.resourceURL || 'assets';
  }
}
