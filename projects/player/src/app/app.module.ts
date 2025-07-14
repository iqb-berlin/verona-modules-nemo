import { BrowserModule } from '@angular/platform-browser';
import { NgModule, provideExperimentalZonelessChangeDetection } from '@angular/core';
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
    MainAudioComponent
  ],
  providers: [
    provideExperimentalZonelessChangeDetection(),
    UnitService,
    ResponsesService,
    VeronaPostService,
    VeronaSubscriptionService,
    MetadataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
