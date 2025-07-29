import { Component, input, output } from '@angular/core';

@Component({
  selector: 'stars-standard-button',
  templateUrl: './standard-button.component.html',
  styleUrls: ['./standard-button.component.scss'],
  standalone: true
})
export class StandardButtonComponent {
  id=input.required<string>();
  value=input.required<number>();
  inputType = input<'radio'|'checkbox'>('radio');
  image = input<string>();
  text = input<string>();
  icon = input<string>();
  selected = input<boolean>();
  isSmallText = input<boolean>(false);
  size = input<string>();
  buttonClick = output<void>();

  onClick(): void {
    this.buttonClick.emit();
  }
}
