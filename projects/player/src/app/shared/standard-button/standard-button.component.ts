import { Component, input, inject } from '@angular/core';
import { UnitService } from '../../services/unit.service';
import { StandardButtonParams } from '../../models/unit-definition';

@Component({
  selector: 'stars-standard-button',
  templateUrl: './standard-button.component.html',
  styleUrls: ['./standard-button.component.scss'],
  standalone: true
})
export class StandardButtonComponent {
  image = input<string>();
  text = input<string>();

  private unitService = inject(UnitService);

  getButtonClasses(): string {
    const params = this.unitService.parameters() as StandardButtonParams;
    const classes = ['button-wrapper'];

    console.log('INSIDE STANDARD BUTTON COMPONENT PARAMS', params);

    if (params?.multiselect) {
      classes.push('multiselect');
    }
    if (params?.wrap) {
      classes.push('wrap');
    }

    return classes.join(' ');
  }
}
