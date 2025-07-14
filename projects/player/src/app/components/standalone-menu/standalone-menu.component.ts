import { Component } from '@angular/core';
import {
  CdkMenu, CdkMenuBar, CdkMenuItem, CdkMenuTrigger
} from '@angular/cdk/menu';

@Component({
  selector: 'stars-standalone-menu',
  standalone: true,
  imports: [
    CdkMenuTrigger,
    CdkMenuItem,
    CdkMenuBar,
    CdkMenu
  ],
  template: `
    <div cdkMenuBar>
      <button class="menu-bar-item" cdkMenuItem [cdkMenuTriggerFor]="file">Menu</button>
    </div>
    <ng-template #file>
      <div class="menu" cdkMenu>
        <button class="menu-item" cdkMenuItem (cdkMenuItemTriggered)="handleDummy()">Dummy 1</button>
        <button class="menu-item" cdkMenuItem (cdkMenuItemTriggered)="handleDummy()">Dummy 2</button>
        <button class="menu-item" cdkMenuItem (cdkMenuItemTriggered)="handleDummy()">Dummy 3</button>
      </div>
    </ng-template>
  `,

  styles: `
    .menu-bar-item {
      cursor: pointer;
      border: none;

      user-select: none;
      min-width: 34px;
      line-height: 26px;
      padding: 0 16px;
    }

    .menu-bar-item:hover {
      background-color: rgb(208, 208, 208);
    }

    .menu {
      display: inline-flex;
      flex-direction: column;
      min-width: 180px;
      max-width: 280px;
      background-color: rgb(255, 255, 255);
      padding: 6px 0;
    }

    .menu hr {
      width: 100%;
      color: rgba(0, 0, 0, 0.12);
    }

    .menu {
      display: inline-flex;
      flex-direction: column;
    }

    .menu .menu-item {
      background-color: transparent;
      cursor: pointer;
      border: none;

      user-select: none;
      min-width: 64px;
      line-height: 36px;
      padding: 0 16px;

      display: flex;
      align-items: center;
      flex-direction: row;
      flex: 1;
    }

    .menu-item > span {
      display: flex;
      flex-direction: row;
      flex: 1;
      justify-content: flex-end;
    }

    .menu .menu-item:hover {
      background-color: rgb(208, 208, 208);
    }

    .menu .menu-item:active {
      background-color: rgb(170, 170, 170);
    }

    .menu-bar-item[aria-expanded='true'],
    .menu-item[aria-expanded='true'] {
      background-color: rgb(208, 208, 208) !important;
    }
  `
})
export class StandaloneMenuComponent {
  // eslint-disable-next-line class-methods-use-this
  handleDummy() {
    alert('Dummy');
  }
}
