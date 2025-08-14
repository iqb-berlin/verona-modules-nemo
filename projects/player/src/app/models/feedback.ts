export interface FeedbackDefinition {
  variableId: string;
  source: 'VALUE' | 'CODE' | 'SCORE';
  method: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN';
  parameter: string;
  audioSource: string;
}

export interface AudioFeedback {
  trigger: 'CONTINUE_BUTTON_CLICK' | 'ANY_RESPONSE';
  feedback: FeedbackDefinition[];
}
