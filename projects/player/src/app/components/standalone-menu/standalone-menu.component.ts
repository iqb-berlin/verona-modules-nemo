import { Component } from '@angular/core';
import {
  CdkMenu, CdkMenuBar, CdkMenuItem, CdkMenuTrigger
} from '@angular/cdk/menu';
import { FileService } from '../../services/file.service';
import { UnitService } from '../../services/unit.service';

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
    <div class="stars-standalone-menu">
      <div cdkMenuBar>
        <button class="menu-bar-item" cdkMenuItem [cdkMenuTriggerFor]="file">load</button>
      </div>
      <ng-template #file>
        <div class="menu" cdkMenu>
          <button class="menu-item" cdkMenuItem (cdkMenuItemTriggered)="load()">from file</button>
          <button class="menu-item" cdkMenuItem (cdkMenuItemTriggered)="handleDummy()">edit</button>
          <button class="menu-item" cdkMenuItem (cdkMenuItemTriggered)="handleDummy()">view responses</button>
        </div>
      </ng-template>
    </div>
  `,
  styleUrl: 'standalone-menu.component.css'
})

export class StandaloneMenuComponent {
  constructor(public unitService: UnitService) { }

  async load(): Promise<void> {
    await FileService.loadFile(['.json', '.voud']).then(fileObject => {
      const unitDefinition = JSON.parse(fileObject.content);
      this.unitService.setNewData(unitDefinition);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  handleDummy() {
    alert('Dummy');
  }
}
