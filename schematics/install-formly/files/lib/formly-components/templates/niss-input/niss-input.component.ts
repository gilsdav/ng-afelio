import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldType } from '@ngx-formly/core';

@Component({
    selector: 'daenae-niss-input',
    templateUrl: './niss-input.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NissInputComponent extends FieldType {

    constructor() {
        super();
    }
}
