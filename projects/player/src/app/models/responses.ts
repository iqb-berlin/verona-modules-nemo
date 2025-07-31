export interface VariableInfo {
  variableId: string;
  responseComplete: 'ALWAYS' | 'IF_ANY_RESPONSE' | 'IF_FULL_CREDIT';
  codingSource: 'VALUE' | 'VALUE_TO_UPPER' | 'SUM' | 'LENGTH';
  codes: Code[];
}

export interface Code {
  method: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN';
  parameter: string;
  code: number;
  score: number;
}
