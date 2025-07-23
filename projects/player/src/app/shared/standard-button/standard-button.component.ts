import { Component, input, output } from '@angular/core';

@Component({
  selector: 'stars-standard-button',
  templateUrl: './standard-button.component.html',
  styleUrls: ['./standard-button.component.scss'],
  standalone: true
})
export class StandardButtonComponent {
  image = input<string>();
  text = input<string>();
  selected = input<boolean>();
  isSmallText = input<boolean>(false);
  size = input<string>();
  buttonClick = output<void>();

  onClick(): void {
    this.buttonClick.emit();
  }

  get buttonClasses(): string {
    const classes = ['button-option'];

    if (this.selected()) {
      classes.push('selected');
    }
    if (this.size()) {
      classes.push(`${this.size().toLowerCase()}-size`);
    }

    return classes.join(' ');
  }
}
