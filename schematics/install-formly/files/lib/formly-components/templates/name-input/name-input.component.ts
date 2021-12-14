import { Validators } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { blockPastSpecialCharracters, checkSpecialCharacters } from '../../../helpers/textinputfilter.helper';
import { capitalize_Words } from '../../../helpers/string.helper';

@Component({
    selector: 'daenae-name-input',
    templateUrl: './name-input.component.html',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class NameInputComponent extends FieldType implements OnInit, OnDestroy {

    checkSpecialCharacters = checkSpecialCharacters;
    blockPastSpecialCharracters = blockPastSpecialCharracters;
    defaultOptions = {
        validators: {
            validation: [Validators.maxLength(50)],
        },
        templateOptions: {
            className: ''
        }
    };

    private subscriptionControl: Subscription;

    constructor(private cdr: ChangeDetectorRef) {
        super();
    }

    ngOnInit() {

        this.subscriptionControl = this.formControl.valueChanges.pipe(debounceTime(50)).subscribe(value => {
            const newValue = capitalize_Words(value);
            this.formControl.patchValue(newValue, { emitEvent: false });
            this.formControl.updateValueAndValidity({ emitEvent: false });
            this.cdr.markForCheck();
        });

    }

    ngOnDestroy() {
        if (this.subscriptionControl) {
            this.subscriptionControl.unsubscribe();
        }
    }
}

