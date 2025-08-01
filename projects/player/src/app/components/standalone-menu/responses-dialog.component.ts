import { Component, inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Response } from '@iqbspecs/response/response.interface';

@Component({
  standalone: true,
  template: `
    <h1>Hello!</h1>
    <div>
      @for (r of data; track r) {
        <p>{{r.id}}</p>
      }
    </div>
    <div>
      <button (click)="dialogRef.close()">Schließen</button>
    </div>
  `
})
export class ResponsesDialogComponent {
  dialogRef = inject<DialogRef<string>>(DialogRef<string>);
  data: Response[] = inject(DIALOG_DATA);
}
