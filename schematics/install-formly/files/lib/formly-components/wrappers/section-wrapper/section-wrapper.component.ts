import { ChangeDetectionStrategy, Component, ViewChild, ViewContainerRef } from '@angular/core';
import { FieldWrapper, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'daenae-section-wrapper',
  templateUrl: './section-wrapper.component.html',
  styleUrls: ['./section-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class SectionWrapperComponent extends FieldWrapper {

    @ViewChild('fieldComponent', { read: ViewContainerRef })
    fieldComponent: ViewContainerRef;

    defaultOptions: FormlyFieldConfig = {
        templateOptions: {
            labelSection: '',
            label: '',
            cardInfo: '',
            cardTitle: '',
            cardStyle: false,
            cardTitleButton: null,
            cardTitleTag: ''
        }
    };
}

