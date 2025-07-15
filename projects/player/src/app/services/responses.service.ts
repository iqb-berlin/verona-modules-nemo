import {Injectable, signal} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';
import { UnitState, UnitStateDataType } from '../models/verona';
import { VeronaPostService } from './verona-post.service';

@Injectable({
  providedIn: 'root'
})

export class ResponsesService {
  firstInteractionDone = signal(false);
  firstResponseGiven = signal(false);
  maxScoreReached = signal(false);
  allResponses: Response[] = [];

  reset() {
    this.firstInteractionDone.set(false);
    this.firstResponseGiven.set(false);
    this.maxScoreReached.set(false);
    this.allResponses = [];
  }

  newResponses(responses: Response[], veronaPostService: VeronaPostService | null) {
    this.allResponses.push(...responses);
    this.firstResponseGiven.set(true);
    if (veronaPostService) {
      const unitState: UnitState = {
        unitStateDataType: UnitStateDataType,
        dataParts: {
          responses: JSON.stringify(this.allResponses)
        },
        responseProgress: 'complete'
      };
      veronaPostService.sendVopStateChangedNotification({ unitState });
    }
  }
}
