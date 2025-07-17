import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
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

export class InteractionButtonsComponent extends InteractionComponentDirective implements OnInit, OnDestroy {
  private unitService = inject(UnitService);
  selectedValues = signal<number[]>([]);

  ngOnInit(): void {
    this.resetSelection();
  }

  ngOnDestroy(): void {
    this.resetSelection();
  }

  private resetSelection(): void {
    this.selectedValues.set([]);
  }


  get options(): SelectionOption[] {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return this.parameters().options;
  }

  get isMultiselect(): boolean {
    const params = this.unitService.parameters() as StandardButtonParams;
    return !!params?.multiselect;
  }

  get params(): string {
    const params = this.unitService.parameters() as StandardButtonParams;
    const classes = ['buttons-container'];

    if (params?.multiselect) {
      classes.push('multiselect');
    }
    if (params?.wrap) {
      classes.push('wrap');
    }

    return classes.join(' ');
  }

  isSelected(index: number): boolean {
    return this.selectedValues().includes(index);
  }

  onButtonClick(index: number): void {
    const currentSelected = this.selectedValues();

    if (this.isMultiselect) {
      if (currentSelected.includes(index)) {
        /* Remove if already selected */
        this.selectedValues.set(currentSelected.filter(i => i !== index));
      } else {
        /* Add to selection */
        this.selectedValues.set([...currentSelected, index]);
      }
    } else {
      /* Handle single selection */
      this.selectedValues.set([index]);
    }

    // Emit the response
  }
}
