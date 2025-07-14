import { Injectable } from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';
import {UnitState, UnitStateDataType} from "../models/verona";
import {VeronaPostService} from "./verona-post.service";

@Injectable({
  providedIn: 'root'
})

export class ResponsesService {
  showContinueButton: boolean = true;
  allResponses: Response[] = [];

  reset() {
    this.showContinueButton = true;
  }

  newResponses(responses: Response[], veronaPostService: VeronaPostService | null) {
    this.allResponses.push(...responses);
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
