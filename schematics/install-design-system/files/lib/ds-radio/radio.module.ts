import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DS_RadioComponent } from './radio.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  declarations: [DS_RadioComponent],
  exports: [DS_RadioComponent],
})
// tslint:disable-next-line: class-name
export class DS_RadioModule { }
