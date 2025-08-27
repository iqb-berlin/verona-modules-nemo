import { Component, computed, inject } from '@angular/core';
import { UnitService } from '../../services/unit.service';

@Component({
  selector: 'stars-ribbon-bars',
  templateUrl: './ribbon-bars.component.html',
  styleUrls: ['./ribbon-bars.component.scss']
})
export class RibbonBarsComponent {
  private unitService = inject(UnitService);

  isWhiteBackground = computed(() => {
    const bgColor = this.unitService.backgroundColor().toLowerCase();
    return bgColor === '#ffffff' || bgColor === '#fff' ||
      bgColor === '#eeeeee' || bgColor === '#eee';
  });
}
