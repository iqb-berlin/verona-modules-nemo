export type ContinueButtonEnum = 'ALWAYS' | 'NO' | 'ON_ANY_RESPONSE' | 'ON_FULL_CREDIT' | 'ON_INTERACTION';
export type InteractionEnum = 'BUTTONS' | 'DROP' | 'WRITE' | 'FIND_ON_IMAGE';
export type IconButtonTypeEnum = 'CHECK_GREEN' | 'CLOSE_RED' | 'CLAP_HANDS';
export type ButtonTypeEnum = 'MEDIUM_SQUARE' | 'BIG_SQUARE' | 'SMALL_SQUARE' | 'TEXT' | 'CIRCLE';
export type ImagePositionEnum = 'TOP' | 'LEFT';

export interface UnitDefinition {
  id: string;
  version?: string;
  backgroundColor?: string;
  continueButtonShow?: ContinueButtonEnum;
  mainAudio: MainAudio;
  interactionType: InteractionEnum;
  interactionParameters: InteractionButtonParams | WriteParams | InteractionDropParams;
}

export interface SelectionOption {
  text?: string;
  imageSource?: string;
  icon?: IconButtonTypeEnum;
}

export interface RepeatButtonConfig {
  option: SelectionOption;
  numberOfOptions: number;
}

export interface InteractionOptions {
  buttons?: SelectionOption[];
  repeatButton?: RepeatButtonConfig;
}

export interface Coding {
  value: number | string;
  code: number;
  score: number;
}

export interface InteractionButtonParams {
  variableId?: string;
  imageSource?: string;
  imagePosition?: ImagePositionEnum;
  text?: string;
  buttonType?: ButtonTypeEnum;
  multiSelect?: boolean;
  numberOfRows?: number;
  options: InteractionOptions;
  numberOfOptions?: number;
}

export interface InteractionDropParams {
  variableId: string;
  imageSource: string;
  text: string;
  options: InteractionOptions;
}

export interface InteractionWriteParams {
  variableId: string;
  imageSource: string;
  text: string;
  addBackspaceKey: boolean;
  addUmlautKeys: boolean;
  keysToAdd: string[];
  maxInputLength: number;
}

export interface MainAudio {
  audioSource: string;
  firstClickLayer?: boolean;
  animateButton?: boolean;
  maxPlay?: number;
}

export interface NumberedOption {
  id: number;
  text: string;
}
