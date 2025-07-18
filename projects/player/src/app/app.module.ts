import { BrowserModule } from '@angular/platform-browser';
import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { AppComponent } from './app.component';
import { ButtonsComponent } from './components/interaction-buttons/buttons.component';
import { WordSelectComponent } from './components/interaction-word-select/word-select.component';
import { SyllabifyComponent } from './components/interaction-syllabify/syllabify.component';
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
import { StandardButtonComponent } from './components/standard-button.component';
import { PhoneticsComponent } from './components/interaction-phonetics/interaction-phonetics.component';

@NgModule({
  declarations: [
    AppComponent,
    ButtonsComponent,
    WordSelectComponent,
    SyllabifyComponent
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
    ContinueButtonComponent,
    StandardButtonComponent,
    PhoneticsComponent
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
