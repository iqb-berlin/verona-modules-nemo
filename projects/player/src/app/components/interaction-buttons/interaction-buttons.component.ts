import { Component, inject } from '@angular/core';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { SelectionOption, StandardButtonParams } from '../../models/unit-definition';
import { StandardButtonComponent } from '../../shared/standard-button/standard-button.component';
import { UnitService } from '../../services/unit.service';

@Component({
  selector: 'stars-interaction-buttons',
  templateUrl: './interaction-buttons.component.html',
  styleUrls: ['./interaction-buttons.component.scss'],
  imports: [StandardButtonComponent],
  standalone: true
})

export class InteractionButtonsComponent extends InteractionComponentDirective {
  private unitService = inject(UnitService);

  get options(): SelectionOption[] {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return this.parameters().options;
  }

  get params(): string {
    const params = this.unitService.parameters() as StandardButtonParams;
    const classes = ['buttons-container'];

    console.log('INSIDE INTERACTION BUTTON COMPONENT PARAMS', params);

    if (params?.multiselect) {
      classes.push('multiselect');
    }
    if (params?.wrap) {
      classes.push('wrap');
    }

    return classes.join(' ');
  }
}
