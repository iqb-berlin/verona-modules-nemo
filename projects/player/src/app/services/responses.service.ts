import { inject, Injectable, signal } from '@angular/core';

import { Response } from '@iqbspecs/response/response.interface';
import { Progress, UnitState, UnitStateDataType } from '../models/verona';
import { VeronaPostService } from './verona-post.service';
import { UnitDefinition } from '../models/unit-definition';
import { Code, VariableInfo } from '../models/responses';
import { FeedbackDefinition } from '../models/feedback';

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
  videoComplete = signal(false);

  allResponses: Response[] = [];
  variableInfo: VariableInfo[] = [];
  veronaPostService = inject(VeronaPostService);
  hasParentWindow = window === window.parent;
  lastResponsesString = '';
  pendingAudioFeedback = signal(false);
  private pendingAudioFeedbackSource = '';
  feedbackDefinitions: FeedbackDefinition[] = [];

  setNewData(unitDefinition: UnitDefinition = null) {
    this.firstInteractionDone.set(false);
    this.unitDefinitionProblem.set('');
    this.mainAudioComplete.set(false);
    this.videoComplete.set(false);
    this.responseProgress.set('none');
    this.variableInfo = [];
    this.allResponses = [];
    this.pendingAudioFeedback.set(false);
    this.pendingAudioFeedbackSource = '';
    this.feedbackDefinitions = [];
    if (unitDefinition) {
      const problems: string[] = [];
      if (unitDefinition.variableInfo && unitDefinition.variableInfo.length > 0) {
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
            problems.push('variableInfo: variableId or codes missing');
          }
        });
      }
      if (unitDefinition.audioFeedback && unitDefinition.audioFeedback.feedback &&
        unitDefinition.audioFeedback.feedback.length > 0) {
        unitDefinition.audioFeedback.feedback.forEach(f => {
          if (f.variableId && f.variableId.length > 0 && f.parameter && f.audioSource) {
            this.feedbackDefinitions.push({
              variableId: f.variableId,
              source: f.source || 'CODE',
              method: f.method || 'EQUALS',
              parameter: f.parameter,
              audioSource: f.audioSource
            });
          } else {
            problems.push('audioFeedback: variableId or parameter or audioSource missing');
          }
        });
      }
      if (problems.length > 0) this.unitDefinitionProblem.set(problems.join('; '));
    }
  }

  newResponses(responses: StarsResponse[]) {
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
      if (response.id === 'videoPlayer') {
        this.videoComplete.set(response.value as number >= 1);
      }
    });

    const responsesAsString = JSON.stringify(this.allResponses);
    if (responsesAsString !== this.lastResponsesString) {
      this.lastResponsesString = responsesAsString;
      // only set response progress if it is relevant for the progress and the status is VALUE_CHANGED
      if (responses[0].relevantForResponsesProgress && responses[0].status === 'VALUE_CHANGED') {
        const getResponsesCompleteOutput = this.getResponsesComplete();
        this.responseProgress.set(getResponsesCompleteOutput);
      }
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
      if (this.feedbackDefinitions.length > 0 && responses.length > 0) {
        this.provideFeedback(responses[0].id);
      }
    }
  }

  private static isPositionInRange(responseValue: string, range: string): boolean {
    if (responseValue && range) {
      const responseMatches = responseValue.match(/\d+/g);
      if (responseMatches && responseMatches.length > 1) {
        const responseX = Number.parseInt(responseMatches[0], 10);
        const responseY = Number.parseInt(responseMatches[1], 10);
        const rangeMatches = range.match(/\d+/g);
        if (rangeMatches && rangeMatches.length > 3) {
          const rangeX1 = Number.parseInt(rangeMatches[0], 10);
          const rangeY1 = Number.parseInt(rangeMatches[1], 10);
          const rangeX2 = Number.parseInt(rangeMatches[2], 10);
          const rangeY2 = Number.parseInt(rangeMatches[3], 10);
          let compareXOk = false;
          if (rangeX1 < rangeX2) {
            compareXOk = responseX >= rangeX1 && responseX <= rangeX2;
          } else {
            compareXOk = responseX <= rangeX1 && responseX >= rangeX2;
          }
          if (compareXOk) {
            if (rangeY1 < rangeY2) {
              return responseY >= rangeY1 && responseY <= rangeY2;
            }
            return responseY <= rangeY1 && responseY >= rangeY2;
          }
        }
      }
    }
    return false;
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
          const matches1 = valueAsString.match(/1/g);
          valueAsNumber = matches1 ? matches1.length : 0;
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
            } else if (c.method === 'IN_POSITION_RANGE') {
              codeFound = ResponsesService.isPositionInRange(valueAsString, c.parameter);
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

  getAudioFeedback(setAsPlayed: boolean): string {
    const returnValue = this.pendingAudioFeedbackSource;
    if (setAsPlayed) {
      this.pendingAudioFeedbackSource = '';
      this.pendingAudioFeedback.set(false);
    }
    return returnValue;
  }

  private provideFeedback(startVariable: string): void {
    this.pendingAudioFeedback.set(false);
    this.pendingAudioFeedbackSource = '';
    const responsesToCheck: string[] = [startVariable,
      ...this.allResponses.filter(r => r.id !== startVariable).map(r => r.id)];
    const audioToPlay: string = responsesToCheck.map(varId => {
      const responseToCheck = this.allResponses.find(r => r.id === varId);
      if (responseToCheck) {
        const feedbacksToUse = this.feedbackDefinitions
          .filter(f => f.variableId === responseToCheck.id);
        const feedbackToTake = feedbacksToUse.find(f => {
          let valueToCompare: string | number | boolean;
          if (f.source === 'VALUE') {
            if (Array.isArray(responseToCheck.value)) {
              valueToCompare = responseToCheck.value.length > 0 ? responseToCheck.value[0] : '';
            } else {
              valueToCompare = responseToCheck.value;
            }
          } else {
            valueToCompare = f.source === 'SCORE' ? responseToCheck.score : responseToCheck.code;
          }
          if (f.method === 'EQUALS') {
            const valueToCompareAsString = typeof valueToCompare === 'string' ?
              valueToCompare : valueToCompare.toString();
            return valueToCompareAsString === f.parameter;
          }
          let valueAsNumber = Number.MIN_VALUE;
          if (typeof valueToCompare === 'number') {
            valueAsNumber = valueToCompare;
          } else if (typeof valueToCompare === 'boolean') {
            valueAsNumber = valueToCompare ? 1 : 0;
          } else {
            valueAsNumber = Number.parseInt(valueToCompare, 10);
          }
          const parameterAsNumber = Number.parseInt(f.parameter, 10);
          if (f.method === 'GREATER_THAN') {
            return valueAsNumber > parameterAsNumber;
          }
          return valueAsNumber < parameterAsNumber;
        });
        return feedbackToTake ? feedbackToTake.audioSource : '';
      }
      return '';
    }).find(sourceString => !!sourceString);
    if (audioToPlay) {
      this.pendingAudioFeedback.set(true);
      this.pendingAudioFeedbackSource = audioToPlay;
    }
    // console.log(this.pendingAudioFeedback(), ' <<>> ', audioToPlay);
  }
}

export interface StarsResponse extends Response {
  relevantForResponsesProgress:boolean;
}
