import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SmartTranslatePipe } from './smart-translate.pipe';
import { AsObservablePipe } from './as-observable.pipe';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        SmartTranslatePipe,
        AsObservablePipe
    ],
    exports: [
        SmartTranslatePipe,
        AsObservablePipe
    ]
})
export class DaenaePipesModule { }
