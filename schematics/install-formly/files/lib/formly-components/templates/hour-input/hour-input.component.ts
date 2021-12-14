import { Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { isHourValid } from '../../validators/hour.validator';

@Component({
    selector: 'daenae-hour-input',
    templateUrl: './hour-input.component.html'
})
export class HourInputComponent extends FieldType implements OnInit {

    public placeholder = '00:00';

    ngOnInit(): void {
        this.formControl.setValidators([
            isHourValid,
            this.to.required ? Validators.required : null
        ]);
    }
}
