import { Component, input } from '@angular/core';

@Component({
  selector: 'stars-standard-button',
  templateUrl: './standard-button.component.html',
  styleUrls: ['./standard-button.component.scss'],
  standalone: true
})
export class StandardButtonComponent {
  image = input<string>();
  text = input<string>();
}
