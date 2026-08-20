import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GeneralModule } from '../general/general.module';

@NgModule({
    declarations: [ ],
    exports: [ ],
    imports: [
        CommonModule,
        MatIconModule,
        GeneralModule,
    ],
})
export class UiDrawerPreviewsModule { }