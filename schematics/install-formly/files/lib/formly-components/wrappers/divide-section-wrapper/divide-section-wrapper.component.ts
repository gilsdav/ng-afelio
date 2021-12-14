import { ChangeDetectionStrategy, Component, ViewChild, ViewContainerRef } from '@angular/core';
import { FieldWrapper, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'daenae-divide-section-wrapper',
  templateUrl: './divide-section-wrapper.component.html',
  styleUrls: ['./divide-section-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DivideSectionWrapperComponent extends FieldWrapper {

    @ViewChild('fieldComponent', { read: ViewContainerRef })
    fieldComponent: ViewContainerRef;

    defaultOptions: FormlyFieldConfig = {
        templateOptions: {
            classes: ''
        }
    };
}
