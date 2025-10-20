import {
  Component, input, output, computed
} from '@angular/core';

import { ButtonTypeEnum } from '../../models/unit-definition';
import { StandardIconComponent } from "../standard-icon/standard-icon.component";

@Component({
  selector: 'stars-standard-button',
  templateUrl: './standard-button.component.html',
  styleUrls: ['./standard-button.component.scss'],
  imports: [
    StandardIconComponent
  ],
  standalone: true
})

export class StandardButtonComponent {
  id = input.required<string>();
  value = input.required<number>();
  inputType = input<'radio' | 'checkbox'>('radio');
  image = input<string>();
  text = input<string>();
  icon = input<string>();
  selected = input<boolean>();
  isSmallText = input<boolean>(false);
  type = input<ButtonTypeEnum>();
  repeatButtons = input<boolean>(false);
  buttonClick = output<void>();

  textMode = computed(() => {
    return !!this.text() && !this.icon() && !this.image();
  });

  // className = computed(() => {
  //   const base = `${((this.type() || '') as string).toLowerCase()  }-type`;
  //   // if it's a circle, prefer 'repeat' class when repeatButtons is truthy,
  //   // otherwise add svg-icon only if the icon is SVG.
  //   if (this.type() === 'CIRCLE') {
  //     // eslint-disable-next-line no-nested-ternary
  //     return base + (this.repeatButtons() ? '-repeat' : (this.isSvgIcon() ? '-svg-icon' : ''));
  //   }
  //   return base + (this.isSvgIcon() ? ' svg-icon' : '');
  // });
  //
  // // safely detect if the current icon represents an SVG (inline SVG or .svg file URL)
  // isSvgIcon(): boolean {
  //   try {
  //     const iconVal = this.icon ? this.icon() : null;
  //     if (!iconVal || typeof iconVal !== 'string') return false;
  //     const trimmed = iconVal.trim();
  //
  //     // treat keys like SMILEY_1, SMILEY_2, ... as SVG sprite/icon identifiers
  //     if (/^smiley_\d+$/i.test(trimmed)) return true;
  //
  //     return false;
  //   } catch {
  //     return false;
  //   }
  // }

  onClick(): void {
    this.buttonClick.emit();
  }
}
