import { Component, input } from '@angular/core';

@Component({
  selector: 'stars-standard-button',
  standalone: true,
  template: `
    <div class="wrapper">
      @if (image()) {
        <p>image</p>
      }
      @if (text) {
        <p>text: {{text()}}</p>
      }
    </div>
  `,

  styles: `
    .wrapper {
      font-size: 20px;
      border: chartreuse 2px solid;
    }
  `
})
export class StandardButtonComponent {
  image = input<string>();
  text = input<string>();
}
