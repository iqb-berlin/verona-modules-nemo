import { inject, Injectable, signal } from '@angular/core';

import { Response } from '@iqbspecs/response/response.interface';
import { Progress, UnitState, UnitStateDataType } from '../models/verona';
import { VeronaPostService } from './verona-post.service';
import { UnitDefinition } from '../models/unit-definition';
import { Code, VariableInfo } from '../models/responses';

@Injectable({
  providedIn: 'root'
})

export class ResponsesService {
  firstInteractionDone = signal(false);
  // todo: delete firstResponseGiven; replace usages by responsesGiven
  // firstResponseGiven = signal(false);
  // todo: delete maxScoreReached; replace usages by responsesGiven
  // maxScoreReached = signal(false);
  unitDefinitionProblem = signal('');
  responseProgress = signal<Progress>('none');
  mainAudioComplete = signal(false);

  allResponses: Response[] = [];
  variableInfo: VariableInfo[] = [];
  veronaPostService = inject(VeronaPostService);
  hasParentWindow = window === window.parent;
  lastResponsesString = '';

  setNewData(unitDefinition: UnitDefinition = null) {
    this.firstInteractionDone.set(false);
    // this.firstResponseGiven.set(false);
    // this.maxScoreReached.set(false);
    this.unitDefinitionProblem.set('');
    this.mainAudioComplete.set(false);
    this.responseProgress.set('none');
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
          this.variableInfo.push(vInfo);
        } else {
          problems.push('variableId or codes missing');
        }
      });
      if (problems.length > 0) this.unitDefinitionProblem.set(problems.join('; '));
    }
  }

  newResponses(responses: Response[]) {
    responses.forEach(response => {
      const codedResponse = this.getCodedResponse(response);
      const responseInStore = this.allResponses.find(r => r.id === response.id);
      if (responseInStore) {
        responseInStore.value = response.value;
        responseInStore.status = codedResponse.status;
        responseInStore.code = codedResponse.code;
        responseInStore.score = codedResponse.score;
      } else {
        this.allResponses.push(codedResponse);
      }
      if (response.id === 'mainAudio') {
        this.mainAudioComplete.set(response.value as number >= 1);
      }
    });

    // calculate responseProgress only when variable is in current response
    // so no change in progress when audio is playing
    const valueResponses = responses.find(r => r.id !== 'mainAudio');
    const responsesAsString = JSON.stringify(this.allResponses);
    if (responsesAsString !== this.lastResponsesString) {
      this.lastResponsesString = responsesAsString;
      if (valueResponses) {
        const getResponsesCompleteOutput = this.getResponsesComplete();
        this.responseProgress.set(getResponsesCompleteOutput);
      }
      // this.firstResponseGiven.set(this.responseProgress() !== 'none');
      // this.maxScoreReached.set(this.responseProgress() === 'complete');
      const unitState: UnitState = {
        unitStateDataType: UnitStateDataType,
        dataParts: {
          responses: responsesAsString
        },
        responseProgress: this.responseProgress()
      };

      if (this.hasParentWindow) {
        // tslint:disable-next-line:no-console
        console.log('unit state changed: ', unitState);
      } else if (this.veronaPostService) {
        this.veronaPostService.sendVopStateChangedNotification({ unitState });
      }
    }
  }

  private getCodedResponse(givenResponse: Response): Response {
    const newResponse = {
      id: givenResponse.id,
      status: givenResponse.status,
      value: givenResponse.value,
      code: givenResponse.code || 0,
      score: givenResponse.score || 0
    };
    if (givenResponse.status === 'VALUE_CHANGED') {
      const codingScheme = this.variableInfo.find(v => v.variableId === givenResponse.id);
      if (codingScheme && codingScheme.codes && codingScheme.codes.length > 0) {
        let valueAsNumber = Number.MIN_VALUE;
        let valueAsString = givenResponse.value.toString();
        if (codingScheme.codingSource === 'SUM') {
          valueAsNumber = valueAsString.match(/1/g).length;
          valueAsString = valueAsNumber.toString();
        } else if (codingScheme.codingSource === 'VALUE_TO_UPPER') {
          valueAsString = valueAsString.toUpperCase();
        }
        let newCode = Number.MIN_VALUE;
        let newScore = Number.MIN_VALUE;
        codingScheme.codes.forEach(c => {
          if (newCode === Number.MIN_VALUE) {
            let codeFound: boolean;
            if (c.method === 'EQUALS') {
              codeFound = valueAsString === c.parameter;
            } else {
              if (!Array.isArray(givenResponse.value) && typeof givenResponse.value === 'string') {
                valueAsNumber = Number.parseInt(givenResponse.value, 10);
              }
              const parameterAsNumber = Number.parseInt(c.parameter, 10);
              if (c.method === 'GREATER_THAN') {
                codeFound = valueAsNumber > parameterAsNumber;
              } else {
                codeFound = valueAsNumber < parameterAsNumber;
              }
            }
            if (codeFound) {
              newCode = c.code;
              newScore = c.score;
            }
          }
        });
        newResponse.status = 'CODING_COMPLETE';
        if (newCode > Number.MIN_VALUE) {
          newResponse.code = newCode;
          newResponse.score = newScore;
        } else {
          newResponse.score = 0;
          const allCodes = codingScheme.codes.map(c => c.code);
          if (allCodes.includes(0)) {
            newCode = Math.max(...allCodes) + 1;
          } else {
            newCode = 0;
          }
        }
      }
    }
    return newResponse;
  }

  private getResponsesComplete(): Progress {
    if (this.allResponses.length === 0) return 'none';
    if (!this.variableInfo || this.variableInfo.length === 0) return 'complete';
    const onAny = this.variableInfo.filter(coding => coding.responseComplete === 'ON_ANY_RESPONSE')
      .map(coding => coding.variableId);
    const onFullCredit = this.variableInfo
      .filter(coding => coding.responseComplete === 'ON_FULL_CREDIT');
    if (onAny.length + onFullCredit.length === 0) return 'complete';
    let isComplete = true;
    onAny.forEach(id => {
      const myResponse = this.allResponses
        .find(r => r.id === id && r.status === 'CODING_COMPLETE');
      if (!myResponse) isComplete = false;
    });
    if (isComplete) {
      onFullCredit.forEach(vi => {
        const maxScore = Math.max(...vi.codes.map(c => c.score));
        const myResponse = this.allResponses
          .find(r => r.id === vi.variableId && r.status === 'CODING_COMPLETE');
        if (!myResponse || myResponse.score < maxScore) isComplete = false;
      });
    }
    return isComplete ? 'complete' : 'some';
  }
}
