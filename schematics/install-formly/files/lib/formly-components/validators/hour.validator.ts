import { FormControl, ValidationErrors } from '@angular/forms';

export function isHourValid(control: FormControl): ValidationErrors {
    const hoursRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return control.value && !control.value.match(hoursRegex) ? { invalidHour: true } : null;
}
