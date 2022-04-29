import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_IconComponent } from './icon.component';
import { TranslateModule } from '@ngx-translate/core';
import { DS_IconService } from './icon.service';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule
  ],
  declarations: [ DS_IconComponent ],
  providers: [ DS_IconService ],
  exports: [ DS_IconComponent ]
})
export class DS_IconModule { }
