export type ContinueButtonEnum = 'ALWAYS' | 'NO' | 'ON_ANY_RESPONSE' | 'ON_FULL_CREDIT' | 'ON_INTERACTION';
export type InteractionEnum = 'BUTTONS' | 'SYLLABIFY' | 'WORD_SELECT' | 'DROP' | 'PHONETICS' | 'WRITE' | 'FIND_ON_IMAGE';
export type IconButtonTypeEnum = 'CHECK_GREEN' | 'CLOSE_RED';

export interface UnitDefinition {
  id: string;
  version?: string;
  backgroundColor?: string;
  continueButtonShow?: ContinueButtonEnum;
  mainAudio?: MainAudio;
  interactionType: InteractionEnum;
  interactionParameters: InteractionButtonParams | SyllabifyParams | WordSelectParams | undefined;
}

export interface SelectionOption {
  text: string;
  imageSource: string;
  icon: IconButtonTypeEnum;
}

export interface Coding {
  value: number | string;
  code: number;
  score: number;
}

export interface InteractionButtonParams {
  variableId: string;
  options: SelectionOption[];
  multiSelect?: boolean;
  numberOfRows?: number;
  size: 'BIG' | 'MEDIUM' | 'SMALL';
  gap: 'BIG' | 'MEDIUM' | 'SMALL';
}

export interface WordSelectParams {
  variableId: string;
  options: SelectionOption[];
  imageSource: string;
  text: string;
  buttonsAsRow: boolean;
}

export interface SyllabifyParams {
  variableId: string;
  imageSource: string;
  text: string;
  numberOfOptions: number;
}

export interface InteractionDropParams {
  variableId: string;
  options: SelectionOption[];
  imageSource: string;
  text: string;
}

export interface PhoneticsParams {
  variableId: string;
  numberOfOptions: number;
}

export interface WriteParams {
  variableId: string;
  addBackspaceKey: boolean;
  addUmlautKeys: boolean;
  imageSource: string;
  text: string;
  maxInputLength: number;
  keysToAdd: string[];
  placeholder: string;
}

export interface MainAudio {
  audioSource: string;
  firstClickLayer: boolean;
  animateButton: boolean;
  maxPlay: number;
}

export interface NumberedOption {
  id: number;
  text: string;
}
