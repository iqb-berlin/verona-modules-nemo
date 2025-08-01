import { Component, HostListener, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

import { VeronaPostService } from './services/verona-post.service';
import { VeronaSubscriptionService } from './services/verona-subscription.service';
import { UnitService } from './services/unit.service';
import { MetadataService } from './services/metadata.service';
import { ResponsesService } from './services/responses.service';
import { VopStartCommand } from './models/verona';
import {
  InteractionButtonParams, InteractionWriteParams, InteractionDropParams
} from './models/unit-definition';

@Component({
  selector: 'stars-player',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  isStandalone: boolean;
  private ngUnsubscribe = new Subject<void>();

  constructor(
    public unitService: UnitService,
    public responsesService: ResponsesService,
    public veronaPostService: VeronaPostService,
    private veronaSubscriptionService: VeronaSubscriptionService,
    private metadataService: MetadataService
  ) { }

  ngOnInit(): void {
    this.veronaSubscriptionService.vopStartCommand
      .subscribe((message: VopStartCommand) => {
        const unitDefinition = JSON.parse(message.unitDefinition);
        this.unitService.setNewData(unitDefinition);
        this.responsesService.setNewData(unitDefinition);
      });
    this.isStandalone = window === window.parent;
    this.veronaPostService.sendReadyNotification(this.metadataService.playerMetadata);
  }

  @HostListener('window:blur')
  onBlur(): void {
    this.veronaPostService.sendVopWindowFocusChangedNotification(false);
  }

  @HostListener('window:focus')
  onFocus(): void {
    this.veronaPostService.sendVopWindowFocusChangedNotification(true);
  }

  get paramsAsInteractionButtonParams() {
    return this.unitService.parameters() as InteractionButtonParams;
  }

  get paramsAsWriteParams() {
    return this.unitService.parameters() as InteractionWriteParams;
  }

  get paramsAsDropParams() {
    return this.unitService.parameters() as InteractionDropParams;
  }
}
