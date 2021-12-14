import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'daenae-simple-checkbox',
  templateUrl: './simple-checkbox.component.html',
  styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class SimpleCheckboxComponent extends FieldType { }

