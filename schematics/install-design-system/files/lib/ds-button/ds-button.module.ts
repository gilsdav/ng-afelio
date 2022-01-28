import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_ButtonComponent } from './ds-button.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
  ],
  declarations: [DS_ButtonComponent],
  exports: [DS_ButtonComponent],
})
export class DS_ButtonModule { }
