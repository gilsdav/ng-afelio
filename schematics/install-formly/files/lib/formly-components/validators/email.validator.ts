import { AbstractControl, ValidationErrors } from '@angular/forms';

export function emailOrEmpty(control: AbstractControl): ValidationErrors | null {
    return !control.value ? null : validateEmailPattern(control);
}

export function validateEmailPattern(control: AbstractControl): ValidationErrors | null {
    const patternEmail = /([a-zA-Z0-9!#$%&'*+=?^_`{|}~.-]+)@([a-zA-Z0-9!#$%&'*+=?^_`{|}~-]+)(\.[a-zA-Z]{2,4})*\.([a-zA-Z]{2,4})$/;

    return patternEmail.test(control.value) ? null : { emailInvalid: true };
}
