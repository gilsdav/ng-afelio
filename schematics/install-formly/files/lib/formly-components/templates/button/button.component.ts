import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';

/**
 * Usage example:
 * `{ key: 'myKey', type: 'button', templateOptions: { label: 'myLabel', click: (field) => { console.log(field); } } }`
 */
@Component({
  selector: 'daenae-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent extends FieldType {

    defaultOptions: FormlyFieldConfig = {
        templateOptions: {
            label: 'NO_LABEL_GIVEN',
            click: () => { throw new Error('You must give a "click" callback into the "templateOptions"'); },
            className: '-primary',
            iconClassName: '',
            isButton: true
        }
    };
}


