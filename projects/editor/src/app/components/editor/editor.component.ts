import { Component, input } from '@angular/core';

@Component({
  selector: 'stars-json-editor',
  templateUrl: './editor.component.html',
  standalone: false
})
export class JsonEditor {
  private data = input.required<any>();

}
