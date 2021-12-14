import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';
import { PhoneNumberType, PhoneNumberUtil } from 'google-libphonenumber';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PrefixPhonesEnum } from '../../../../../../../src/app/modules/folder360/enums/prefix-phones.enum';
import {
    blockPastSpecialCharracters,
    checkSpecialCharacters
} from '../../../helpers/textinputfilter.helper';
import { PhoneNumberValidator } from '../../validators/phone-validator';

@Component({
    selector: 'daenae-phone',
    templateUrl: './phone.component.html',
    styleUrls: ['./phone.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhoneComponent extends FieldType implements OnInit, OnDestroy, DoCheck {

    public checkSpecialCharacters = checkSpecialCharacters;
    public blockPastSpecialCharracters = blockPastSpecialCharracters;
    public prefixesValues = Object.values(PrefixPhonesEnum);
    private destroy$: Subject<boolean> = new Subject<boolean>();
    public phoneFormGroup: FormGroup;
    public isRequired: boolean;

    defaultOptions: FormlyFieldConfig = {
        templateOptions: {
            phoneTypeDetected: (phoneType: PhoneNumberType) => { },
        }
    };

    constructor(private cdr: ChangeDetectorRef) {
        super();
    }

    ngOnInit(): void {
        let initialValue = { prefix: PrefixPhonesEnum.BE, phoneNumber: '' };
        if (this.formControl.value) {
            initialValue = this.getPhoneNumberFromString(this.formControl.value);
        }

        this.phoneFormGroup = new FormGroup({
            prefix: new FormControl(initialValue.prefix),
            phone: new FormControl(initialValue.phoneNumber, this.to.required ? [ Validators.required ] : [])
        }, PhoneNumberValidator.phoneNumberValidator('prefix', 'phone'));

        this.applyErrorsOfFormly();
            this.phoneFormGroup.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(state => {
            this.applyErrorsOfFormly();
        });

        this.phoneFormGroup.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
            this.applyFormControlValue(true);
        });

        this.formControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
            this.setPhoneNumber(value);
            this.applyErrorsOfFormly();
            this.cdr.markForCheck();
        });
    }

    private applyErrorsOfFormly() {
        let errors = {};

        if (this.phoneFormGroup.errors) {
            errors = {...this.phoneFormGroup.errors};
        }
        if (this.phoneFormGroup.get('phone').errors) {
            errors = {...this.phoneFormGroup.get('phone').errors};
        }
        if (!Object.keys(errors).length) {
            errors = null;
        }
        this.formControl.setErrors(errors);
    }

    public isTouched() {
        this.formControl.markAsTouched();
    }

    ngDoCheck(): void {
        this.applyDisability(this.field.formControl.disabled);
        this.applyRequired(this.to.required);
    }

    ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.complete();
    }

    private setPhoneNumber(phoneNumberToParse: string) {
        const phoneNumberParsed = this.getPhoneNumberFromString(phoneNumberToParse);
        const prefixValue = phoneNumberParsed.prefix;
        this.phoneFormGroup.controls.prefix.setValue(prefixValue, { emitEvent: false });
        this.phoneFormGroup.controls.phone.setValue(phoneNumberParsed.phoneNumber, { emitEvent: false });
        this.applyFormControlValue();
    }

    private getPhoneNumberFromString(phoneNumberToParse: string) {
        if (phoneNumberToParse === null) {
            const phoneGroupValue = this.phoneFormGroup.value;
            const prefix =  phoneGroupValue && phoneGroupValue.prefix ? phoneGroupValue.prefix :  PrefixPhonesEnum['BE'];
            return {
                prefix: prefix,
                phoneNumber: ''
            };
        }
        const phoneNumberUtil = PhoneNumberUtil.getInstance();
        try {
            const phoneNumber = phoneNumberUtil.parseAndKeepRawInput(phoneNumberToParse, 'BE');
            const countryCode = phoneNumberUtil.getRegionCodeForNumber(phoneNumber);
            const phoneType = phoneNumberUtil.getNumberType(phoneNumber);
            const phone = phoneNumber.getNationalNumber().toString();
            this.to.phoneTypeDetected(phoneType, this.field);
            return {
                prefix: PrefixPhonesEnum[countryCode] || this.phoneFormGroup.controls.prefix.value,
                phoneNumber: phone
            };

        } catch (exception) {
            const prefix = this.phoneFormGroup.controls.prefix.value || PrefixPhonesEnum['BE'];

            return {
                prefix: prefix,
                phoneNumber: phoneNumberToParse.replace(prefix, '')
            };
        }
    }

    private applyDisability(value: boolean) {
        if (value !== this.phoneFormGroup.disabled) {
            if (value) {
                this.phoneFormGroup.disable();
            } else {
                this.phoneFormGroup.enable();
            }
        }
    }

    private applyRequired(value: boolean) {
        if (value !== this.isRequired) {
            if (value) {
                this.phoneFormGroup.get('phone').setValidators([Validators.required]);
            } else {
                this.phoneFormGroup.get('phone').setValidators([]);
            }
            this.isRequired = value;
            this.phoneFormGroup.updateValueAndValidity();
        }

    }

    private applyFormControlValue(emitEvent = false): void {
        if (this.phoneFormGroup.value?.phone) {
            this.formControl.setValue(`${this.phoneFormGroup.value.prefix}${this.phoneFormGroup.value.phone}`, { emitEvent });
        } else {
            this.formControl.setValue(null, { emitEvent });
        }
    }

}
