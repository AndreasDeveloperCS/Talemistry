import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SunSpinnerComponent } from '../general/components/sun-spinner/sun-spinner.component';
import { GeneralModule } from '../general/general.module';
import { NotificationPreferencesGridCardsComponent } from './components/notification-preferences-grid-cards/notification-preferences-grid-cards.component';
import { NotificationPreferencesListViewComponent } from './components/notification-preferences-list-view/notification-preferences-list-view.component';
import { NotificationPreferencesSelectorComponent } from './components/notification-preferences-selector/notification-preferences-selector.component';
import { NotificationPreferencesToggleCardsComponent } from './components/notification-preferences-toggle-cards/notification-preferences-toggle-cards.component';
import { TelegramComponent } from './components/telegram/telegram.component';

@NgModule({
  declarations: [
    TelegramComponent,
    NotificationPreferencesGridCardsComponent,
    NotificationPreferencesListViewComponent,
    NotificationPreferencesToggleCardsComponent,
    NotificationPreferencesSelectorComponent,
  ], 
  exports: [
    TelegramComponent,
    NotificationPreferencesGridCardsComponent,
    NotificationPreferencesListViewComponent,
    NotificationPreferencesToggleCardsComponent,
    NotificationPreferencesSelectorComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    GeneralModule,
    MatIconModule,
    SunSpinnerComponent,
  ]
})
export class CommunicationModule { }
