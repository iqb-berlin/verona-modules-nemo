import { VariableInfo } from './responses';
import { AudioFeedback } from './feedback';

export type ContinueButtonEnum = 'ALWAYS' | 'NO' | 'ON_ANY_RESPONSE' | 'ON_AUDIO_AND_RESPONSE' |
'ON_RESPONSES_COMPLETE' | 'ON_MAIN_AUDIO_COMPLETE' | 'ON_VIDEO_COMPLETE';
export type InteractionEnum = 'BUTTONS' | 'DROP' | 'WRITE' | 'FIND_ON_IMAGE' | 'VIDEO' | 'IMAGE_ONLY' | 'NONE';
export type IconButtonTypeEnum = 'CHECK_GREEN' | 'CLOSE_RED' | 'CLAP_HANDS';
export type ButtonTypeEnum = 'MEDIUM_SQUARE' | 'BIG_SQUARE' | 'SMALL_SQUARE' | 'TEXT' | 'CIRCLE';
export type ImagePositionEnum = 'TOP' | 'LEFT';
export type TargetSizeEnum = 'MEDIUM' | 'LARGE' | 'SMALL';

export interface UnitDefinition {
  id: string;
  version?: string;
  backgroundColor?: string;
  ribbonBars?: boolean;
  continueButtonShow?: ContinueButtonEnum;
  mainAudio?: MainAudio;
  interactionType: InteractionEnum;
  interactionParameters: InteractionButtonParams | WriteParams | InteractionDropParams |
  InteractionImageOnlyParams | InteractionFindOnImageParams;
  variableInfo: VariableInfo[] | undefined;
  audioFeedback: AudioFeedback | undefined;
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
  variableId: string;
  options: InteractionOptions;
  imageSource: string;
  imagePosition: ImagePositionEnum;
  text: string;
  multiSelect?: boolean;
  numberOfRows?: number;
  buttonType: ButtonTypeEnum;
}

export interface InteractionDropParams {
  variableId: string;
  options: SelectionOption[];
  imageSource: string;
  text: string;
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

export interface InteractionImageOnlyParams {
  imageSource: string;
}

export interface InteractionFindOnImageParams {
  variableId: string;
  imageSource: string;
  text: string;
  showArea: string;
  size: TargetSizeEnum;
}

export interface InteractionVideoParams {
  variableId: string;
  videoSource: string;
  imageSource: string;
  text: string;
}

export interface MainAudio {
  audioSource: string;
  firstClickLayer?: boolean;
  animateButton?: boolean;
  maxPlay?: number;
  disableInteractionUntilComplete?: boolean;
}
