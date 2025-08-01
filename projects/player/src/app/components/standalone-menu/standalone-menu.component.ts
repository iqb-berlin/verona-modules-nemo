import {Component, inject} from '@angular/core';
import {
  CdkMenu, CdkMenuBar, CdkMenuItem, CdkMenuTrigger
} from '@angular/cdk/menu';
import { FileService } from '../../services/file.service';
import { UnitService } from '../../services/unit.service';
import { ResponsesService } from '../../services/responses.service';
import {Dialog} from "@angular/cdk/dialog";
import {ResponsesDialogComponent} from "./responses-dialog.component";

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
          <button class="menu-item" cdkMenuItem (cdkMenuItemTriggered)="showResponses()">view responses</button>
        </div>
      </ng-template>
    </div>
  `,
  styleUrl: 'standalone-menu.component.css'
})

export class StandaloneMenuComponent {
  dialog = inject(Dialog);

  constructor(
    public unitService: UnitService,
    public responsesService: ResponsesService
  ) { }

  async load(): Promise<void> {
    await FileService.loadFile(['.json', '.voud']).then(fileObject => {
      const unitDefinition = JSON.parse(fileObject.content);
      this.unitService.setNewData(unitDefinition);
      this.responsesService.setNewData(unitDefinition);
    });
  }

  showResponses() {
    const dialogRef = this.dialog.open<string>(ResponsesDialogComponent, {
      width: '250px',
      data: this.responsesService.allResponses
    });

    dialogRef.closed.subscribe(() => {
      console.log('The dialog was closed');
    });
  }

  // eslint-disable-next-line class-methods-use-this
  handleDummy() {
    alert('Dummy');
  }
}
