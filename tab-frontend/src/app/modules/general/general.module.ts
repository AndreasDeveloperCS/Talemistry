import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ConfirmationPlateComponent } from './components/confirmation-plate/confirmation-plate.component';
import { CurrencySelectComponent } from './components/currency-select/currency-select.component';
import { DeleteIconComponent } from './components/delete-icon/delete-icon.component';
import { DocxRenderingDialogComponent } from './components/docx-rendering-dialog/docx-rendering-dialog.component';
import { DropDownFilterBaseComponent } from './components/drop-down-filter-base/drop-down-filter-base.component';
import { GdprPolicyConfirmationFormComponent } from './components/gdpr-policy-confirmation-form/gdpr-policy-confirmation-form.component';
import { InputFilterBaseComponent } from './components/input-filter-base/input-filter-base.component';
import { LikeButtonComponent } from './components/like-button/like-button.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { PrimaryDigitInputElementComponent } from './components/primary-digit-input-element/primary-digit-input-element.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { TableTemplateComponent } from './components/table-template/table-template.component';
import { ToggleButtonComponent } from './components/toggle-button/toggle-button.component';
import { WarningsErrorsDialogComponent } from './components/warnings-errors-dialog/warnings-errors-dialog.component';
import { ConfirmationDialogComponent } from './dialogs/confirmation-dialog/confirmation-dialog.component';
import { NotificationWindowComponent } from './dialogs/notification-window/notification-window.component';
import { HoverDescriptionDirective } from './directives/hover-description.directive';
import { FileSizePipe } from './pipes/file-size';
import { SanitizerUrlPipe } from './pipes/sanitizer-url.pipe';
import { AbsoluteUrlPipe } from './pipes/absolute-url.pipe';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { TimezoneSelectComponent } from './components/timezone-select/timezone-select.component';
import { LazySectionDirective } from './directives/lazy-section.directive';
import { ConfirmRequestDialogComponent } from './dialogs/confirm-request-dialog/confirm-request-dialog.component';
import { MonthYearRangePipe } from './pipes/month-year-range.pipe';


@NgModule({
  declarations: [
    ConfirmationDialogComponent,
    ConfirmRequestDialogComponent,
    NotificationWindowComponent,
    CurrencySelectComponent,
    DropDownFilterBaseComponent,
    GdprPolicyConfirmationFormComponent,
    InputFilterBaseComponent,
    PrivacyPolicyComponent,
    DeleteIconComponent,
    HoverDescriptionDirective,
    LazySectionDirective,
    TableTemplateComponent,
    DocxRenderingDialogComponent,
    FileSizePipe,
    PrimaryDigitInputElementComponent,
    LikeButtonComponent,
    ToggleButtonComponent,
    ConfirmationPlateComponent,
    WarningsErrorsDialogComponent,
    AbsoluteUrlPipe,
    MonthYearRangePipe,
    TimezoneSelectComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    SanitizerUrlPipe,
    MatSelectModule,
    MatOptionModule,
    DragDropModule,
    MatIconModule,
    MatAutocompleteModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    MatFormFieldModule,
    MatButtonModule,
  ],
  exports: [
    ConfirmationDialogComponent,
    ConfirmRequestDialogComponent,
    NotificationWindowComponent,
    SanitizerUrlPipe,
    LoadingSpinnerComponent,
    CurrencySelectComponent,
    DropDownFilterBaseComponent,
    GdprPolicyConfirmationFormComponent,
    InputFilterBaseComponent,
    PrivacyPolicyComponent,
    DeleteIconComponent,
    HoverDescriptionDirective,
    LazySectionDirective,
    TableTemplateComponent,
    DocxRenderingDialogComponent,
    FileSizePipe,
    PrimaryDigitInputElementComponent,
    LikeButtonComponent,
    ToggleButtonComponent,
    ConfirmationPlateComponent,
    WarningsErrorsDialogComponent,
    AbsoluteUrlPipe,
    MonthYearRangePipe,
    TimezoneSelectComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }
  ],
})
export class GeneralModule { }
