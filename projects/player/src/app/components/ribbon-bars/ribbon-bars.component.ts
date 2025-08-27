import {Component, computed, inject, input} from '@angular/core';
import { UnitService } from '../../services/unit.service';

@Component({
  selector: 'stars-ribbon-bar',
  template: `
    <div [class]="ribbonClass()">
    </div>
  `,
  styleUrls: ['./ribbon-bars.component.scss']
})
export class RibbonBarsComponent {
  backgroundColor = input('white');

  ribbonClass = computed(() => {
    const bgColorUpper = this.backgroundColor().toUpperCase();
    return ['#FFF', '#FFFFFF', '#EEE', '#EEEEEE', 'WHITE'].includes(bgColorUpper) ? 'ribbon-bar-white' : 'ribbon-bar';
  });
}
