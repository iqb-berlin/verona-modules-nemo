import { inject, Injectable, signal } from '@angular/core';

import { Response } from '@iqbspecs/response/response.interface';
import { UnitState, UnitStateDataType } from '../models/verona';
import { VeronaPostService } from './verona-post.service';
import { UnitDefinition } from '../models/unit-definition';
import { Code, VariableInfo } from '../models/responses';

@Injectable({
  providedIn: 'root'
})

export class ResponsesService {
  firstInteractionDone = signal(false);
  firstResponseGiven = signal(false);
  maxScoreReached = signal(false);
  unitDefinitionProblem = signal('');
  allResponses: Response[] = [];
  variableInfo: VariableInfo[] = [];
  veronaPostService = inject(VeronaPostService);

  setNewData(unitDefinition: UnitDefinition = null) {
    this.firstInteractionDone.set(false);
    this.firstResponseGiven.set(false);
    this.maxScoreReached.set(false);
    this.unitDefinitionProblem.set('');
    this.variableInfo = [];
    this.allResponses = [];
    if (unitDefinition && unitDefinition.variableInfo && unitDefinition.variableInfo.length > 0) {
      const problems: string[] = [];
      unitDefinition.variableInfo.forEach(vInfo => {
        if (vInfo.variableId && vInfo.variableId.length > 0 && vInfo.codes && vInfo.codes.length > 0) {
          const newVInfo: VariableInfo = {
            variableId: vInfo.variableId,
            responseComplete: 'ALWAYS',
            codingSource: 'VALUE',
            codes: []
          };
          if (vInfo.codingSource) newVInfo.codingSource = vInfo.codingSource;
          vInfo.codes.forEach(c => {
            const newCode: Code = {
              method: 'EQUALS',
              parameter: '',
              code: 1,
              score: 1
            };
            if (c.method) newCode.method = c.method;
            if (c.parameter) newCode.parameter = c.parameter;
            if (c.code) newCode.code = c.code;
            if (c.score) newCode.score = c.score;
            newVInfo.codes.push(newCode);
          });
        } else {
          problems.push('variableId or codes missing');
        }
      });
      if (problems.length > 0) this.unitDefinitionProblem.set(problems.join('; '));
    }
  }

  newResponses(responses: Response[]) {
    this.allResponses.push(...responses);
    this.firstResponseGiven.set(true);

    const unitState: UnitState = {
      unitStateDataType: UnitStateDataType,
      dataParts: {
        responses: JSON.stringify(this.allResponses)
      },
      responseProgress: 'complete'
    };

    if (window === window.parent) {
      console.log('state changed: ', unitState);
    } else if (this.veronaPostService) {
      this.veronaPostService.sendVopStateChangedNotification({ unitState });
    }
  }
}
