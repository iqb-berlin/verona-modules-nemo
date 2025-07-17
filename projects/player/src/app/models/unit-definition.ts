export type ContinueButtonEnum = 'show' | 'hide' | 'on-response' | 'on-full-credit';
export type InteractionEnum = 'buttons' | 'syllabify' | 'word-select' | 'drop' | 'phonetics' | 'write';

export interface SelectionOption {
  text: string;
  image: string;
}

export interface Coding {
  value: number | string;
  code: number;
  score: number;
}

export interface StandardButtonParams {
  options: SelectionOption;
  multiselect?: boolean;
  wrap?: boolean;
}
