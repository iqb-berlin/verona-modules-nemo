import { BrowserModule } from '@angular/platform-browser';
import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { AppComponent } from './app.component';
import { InteractionButtonsComponent } from './components/interaction-buttons/interaction-buttons.component';
import { ResponsesService } from './services/responses.service';
import { UnitService } from './services/unit.service';
import { VeronaPostService } from './services/verona-post.service';
import { VeronaSubscriptionService } from './services/verona-subscription.service';
import { MetadataService } from './services/metadata.service';
import { ContinueButtonComponent } from './components/continue-button.component';
import { StandaloneMenuComponent } from './components/standalone-menu/standalone-menu.component';
import { MainAudioComponent } from './components/main-audio/main-audio.component';
import { SafeResourceUrlPipe } from './pipes/safe-resource-url.pipe';
import { LinebreaksHtmlPipe } from './pipes/linebreaks-html.pipe';
import { ClickLayerComponent } from './components/main-audio/click-layer.component';
import { MediaPlayerComponent } from './components/main-audio/media-player.component';
import { StandardButtonComponent } from './shared/standard-button/standard-button.component';
import { InteractionWriteComponent } from './components/interaction-write/interaction-write.component';
import { InteractionDropComponent } from './components/interaction-drop/interaction-drop.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    NgOptimizedImage,
    ContinueButtonComponent,
    StandaloneMenuComponent,
    SafeResourceUrlPipe,
    LinebreaksHtmlPipe,
    MainAudioComponent,
    ClickLayerComponent,
    MediaPlayerComponent,
    MainAudioComponent,
    InteractionButtonsComponent,
    ContinueButtonComponent,
    StandardButtonComponent,
    InteractionDropComponent,
    InteractionWriteComponent
  ],
  providers: [
    provideZonelessChangeDetection(),
    UnitService,
    ResponsesService,
    VeronaPostService,
    VeronaSubscriptionService,
    MetadataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
