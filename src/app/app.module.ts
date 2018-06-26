import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { FloatingDotsComponent } from './canvas/floating-dots/floating-dots.component';
import { CirculatingDotsComponent } from './canvas/circulating-pixels/circulating-pixels.component';

import { AppRoutingModule } from './app-routing.module';

import {
  MatButtonModule,
  MatCardModule,
  MatIconModule
} from '@angular/material';

import { WINDOW_PROVIDERS } from './services/window.service';
import { ScrollService } from './services/scroll.service';

const Components = [
  AppComponent,
  HomeComponent,
  PageNotFoundComponent,
  FloatingDotsComponent,
  CirculatingDotsComponent
];

const MaterialModules = [MatButtonModule, MatCardModule, MatIconModule];

@NgModule({
  declarations: Components,
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ...MaterialModules
  ],
  providers: [WINDOW_PROVIDERS, ScrollService],
  bootstrap: [AppComponent]
})
export class AppModule {}
