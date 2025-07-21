export type ContinueButtonEnum = 'ALWAYS' | 'NO' | 'ON_ANY_RESPONSE' | 'ON_FULL_CREDIT' | 'ON_INTERACTION';
export type InteractionEnum = 'BUTTONS' | 'SYLLABIFY' | 'WORD_SELECT' | 'DROP' | 'PHONETICS' | 'WRITE' | 'FIND_ON_IMAGE';
export type IconButtonTypeEnum = 'CHECK_GREEN' | 'CLOSE_RED';


export interface SelectionOption {
  text: string;
  image: string;
  icon: IconButtonTypeEnum;
}

export interface Coding {
  value: number | string;
  code: number;
  score: number;
}

export interface mainAudio {
  audioSource: string;
  firstClickLayer: boolean;
  animateButton: boolean;
  maxCount: number;
}
