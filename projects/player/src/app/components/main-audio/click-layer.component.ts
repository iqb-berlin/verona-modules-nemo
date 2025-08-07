import {
  Component, OnInit, output, ViewChild
} from '@angular/core';

@Component({
  selector: 'stars-click-layer',
  template: `
    <div #starsClickLayer class="layer"></div>
  `,

  styles: `
    .layer {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: transparent;
      cursor: pointer;
      z-index: 99
    }
  `
})
export class ClickLayerComponent implements OnInit {
  @ViewChild('starsClickLayer') layerElement: HTMLDivElement;
  click = output();

  ngOnInit() {
    if (this.layerElement) {
      this.layerElement.addEventListener('click', this.handleClick, { capture: true });
      this.layerElement.addEventListener('touchstart', this.handleClick, { capture: true });
      this.layerElement.addEventListener('touchend', this.handleClick, { capture: true });
      this.layerElement.addEventListener('pointerdown', this.handleClick, { capture: true });
      this.layerElement.addEventListener('mousedown', this.handleClick, { capture: true });
    }
  }

  handleClick() {
    this.click.emit();
  }
}
