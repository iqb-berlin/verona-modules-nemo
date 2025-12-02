import { BrowserModule } from '@angular/platform-browser';
import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';

import { ResponsesService } from './services/responses.service';
import { UnitService } from './services/unit.service';
import { VeronaPostService } from './services/verona-post.service';
import { VeronaSubscriptionService } from './services/verona-subscription.service';
import { MetadataService } from './services/metadata.service';
import { AudioService } from './services/audio.service';
import { SafeResourceUrlPipe } from './pipes/safe-resource-url.pipe';
import { LinebreaksHtmlPipe } from './pipes/linebreaks-html.pipe';
import { AppComponent } from './app.component';
import { InteractionButtonsComponent } from './components/interaction-buttons/interaction-buttons.component';
import { ContinueButtonComponent } from './components/continue-button/continue-button.component';
import { StandaloneMenuComponent } from './components/standalone-menu/standalone-menu.component';
import { AudioComponent } from './components/audio/audio.component';
import { ClickLayerComponent } from './components/audio/click-layer.component';
import { StandardButtonComponent } from './shared/standard-button/standard-button.component';
import { InteractionWriteComponent } from './components/interaction-write/interaction-write.component';
import { InteractionDropComponent } from './components/interaction-drop/interaction-drop.component';
import { InteractionImageOnlyComponent } from './components/interaction-image-only/interaction-image-only.component';
import { InteractionVideoComponent } from './components/interaction-video/interaction-video.component';
import { InteractionFindOnImageComponent } from './components/interaction-find-on-image/find-on-image.component';
import { RibbonBarComponent } from './components/ribbon-bar/ribbon-bar.component';
import { InteractionPolygonButtonsComponent }
  from './components/interaction-polygon-buttons/interaction-polygon-buttons.component';
import { AudioButtonComponent } from './shared/audio-button/audio-button.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    NgOptimizedImage,
    ContinueButtonComponent,
    StandaloneMenuComponent,
    SafeResourceUrlPipe,
    LinebreaksHtmlPipe,
    AudioComponent,
    AudioButtonComponent,
    ClickLayerComponent,
    InteractionButtonsComponent,
    ContinueButtonComponent,
    StandardButtonComponent,
    InteractionDropComponent,
    InteractionWriteComponent,
    InteractionImageOnlyComponent,
    InteractionVideoComponent,
    InteractionFindOnImageComponent,
    RibbonBarComponent,
    InteractionPolygonButtonsComponent
  ],
  providers: [
    provideZonelessChangeDetection(),
    UnitService,
    ResponsesService,
    AudioService,
    VeronaPostService,
    VeronaSubscriptionService,
    MetadataService,
    provideLottieOptions({
      player: () => player
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
