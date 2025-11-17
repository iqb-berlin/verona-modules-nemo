import { Response } from '@iqbspecs/response/response.interface';
import { VariableInfo } from './responses';
import { AudioFeedback } from './feedback';

// eslint-disable-next-line max-len
export type ContinueButtonEnum = 'ALWAYS' | 'NO' | 'ON_ANY_RESPONSE' | 'ON_RESPONSES_COMPLETE' | 'ON_MAIN_AUDIO_COMPLETE' | 'ON_VIDEO_COMPLETE' | 'ON_AUDIO_AND_RESPONSE';
export type InteractionEnum = 'BUTTONS' | 'DROP' | 'WRITE' | 'FIND_ON_IMAGE' | 'VIDEO' | 'IMAGE_ONLY' | 'NONE';
export type IconButtonTypeEnum = 'CHECK_GREEN' | 'CLOSE_RED' | 'CLAP_HANDS' | 'SMILEY_1' | 'SMILEY_2' | 'SMILEY_3' | 'SMILEY_4' | 'SMILEY_5';
export type ButtonTypeEnum = 'MEDIUM_SQUARE' | 'BIG_SQUARE' | 'SMALL_SQUARE' | 'TEXT' | 'CIRCLE' | 'EXTRA_LARGE_SQUARE' | 'LONG_RECTANGLE';
export type ImagePositionEnum = 'TOP' | 'LEFT' | 'BOTTOM';
export type TargetSizeEnum = 'MEDIUM' | 'LARGE' | 'SMALL';
export type OpeningImageStartTriggerEnum = 'UNIT_START' | 'START_BUTTON' | 'MAIN_AUDIO_END';

export interface UnitDefinition {
  id: string;
  version?: string;
  backgroundColor?: string;
  ribbonBars?: boolean;
  continueButtonShow?: ContinueButtonEnum;
  mainAudio?: MainAudio;
  openingImage?: OpeningImageParams;
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

export interface InteractionButtonParams {
  variableId: string;
  options: InteractionOptions;
  imageSource: string;
  imagePosition: ImagePositionEnum;
  imageMaxWidthPx?: number;
  imageMaxHeightPx?: number;
  imageUseFullArea?: boolean;
  text?: string;
  multiSelect?: boolean;
  numberOfRows?: number;
  buttonType: ButtonTypeEnum;
  triggerNavigationOnSelect?: boolean;
  formerState?: Response[];
}

export interface InteractionDropParams {
  variableId: string;
  options: SelectionOption[];
  imageSource: string;
  imagePosition?: ImagePositionEnum;
  imageLandingXY?: string;
  text: string;
  formerState?: Response[];
}

export interface InteractionWriteParams {
  variableId: string;
  imageSource: string;
  text: string;
  addBackspaceKey: boolean;
  addUmlautKeys: boolean;
  keysToAdd: string[];
  maxInputLength: number;
  formerState?: Response[];
}

export interface InteractionImageOnlyParams {
  variableId: string;
  imageSource: string;
}

export interface InteractionFindOnImageParams {
  variableId: string;
  imageSource: string;
  text: string;
  showArea: string;
  size: TargetSizeEnum;
  formerState?: Response[];
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

export interface OpeningImageParams {
  imageSource: string;
  startTrigger?: OpeningImageStartTriggerEnum;
  startDelayMS?: number;
  presentationDurationMS?: number;
  audioSource?: string;
}
