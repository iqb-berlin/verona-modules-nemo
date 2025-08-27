import {
  Component, computed, input
} from '@angular/core';

@Component({
  selector: 'stars-ribbon-bar',
  template: `
    <div [class]="ribbonClass()">
    </div>
  `,
  styleUrls: ['./ribbon-bar.component.scss']
})
export class RibbonBarComponent {
  backgroundColor = input('white');

  ribbonClass = computed(() => {
    const bgColorUpper = this.backgroundColor().toUpperCase();
    return ['#FFF', '#FFFFFF', '#EEE', '#EEEEEE', 'WHITE'].includes(bgColorUpper) ? 'ribbon-bar-white' : 'ribbon-bar';
  });
}
