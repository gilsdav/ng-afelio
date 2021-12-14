import { FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import moment from 'moment-es6';

export function stringToMoment(dateValue: string) {
    // tslint:disable-next-line: max-line-length
    // const ptDatePattern = /^(((0[1-9]|[12]\d|3[01])\/(0[13578]|1[02])\/((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\/(0[13456789]|1[012])\/((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\/02\/((19|[2-9]\d)\d{2}))|(29\/02\/((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$/g;

    if (dateValue.length === 8 && !dateValue.includes('/')) {
        dateValue = [dateValue.slice(0, 2), '/', dateValue.slice(2, 4), '/', dateValue.slice(4, 8)].join('');
    }
    return moment(dateValue, 'DD/MM/YYYY', true);
}

//       if (DateValidator.isValidDate(birthDateMoment.format())) {

//         if (value.length !== 10) {
//           return { dateValidator: 'InvalidFormat' };
//         }
//         const maxDateMoment: moment.Moment = moment();
//         const minDateMoment: moment.Moment = moment('01/01/1900', 'DD/MM/YYYY');
//         if (maxDateMoment && birthDateMoment.isAfter(maxDateMoment)) {
//           return { dateValidator: 'IncoherentDate' };
//         }
//         if (minDateMoment && birthDateMoment.isBefore(minDateMoment)) {
//           return { dateValidator: 'IncoherentDate' };
//         }
//         return null;
//       } else {
//         return { dateValidator: 'DateNotValid' };
//       }
//     } else {
//       return { dateValidator: 'DateNotValid' };
//     }
//   }
export function formatStringToDateFormat(date: string): string {
    return moment(date, 'DD/MM/YYYY').format('YYYY-MM-DDTHH:mm:ss.SSSSZ');
}

export function dateToString(date: (Date | string), format: string = 'DD/MM/YYYY'): string {
    if (date) {
        return moment(date).format(format);
    }
    return '';
}

export function isValidDate(date: string): boolean {
    const dateFormat = 'DD-MM-YYYY';
    return moment(moment(date, dateFormat).format(dateFormat), dateFormat, true).isValid();
}

/**
 * Check if `a` is after `b`
 */
export function compareDates(a: string, b: string) {
    const aDate = moment(a, 'DD/MM/YYYY');
    const bDate = moment(b, 'DD/MM/YYYY');

    return aDate.isAfter(bDate);
}

/**
 * Check if `a` is after `b`
 */
 export function compareTime(a: string, b: string) {
    const aDate = moment(a, 'HH:mm');
    const bDate = moment(b, 'HH:mm');

    return aDate.isAfter(bDate);
}



export function dateRangeValidator(
    startDateControl: string = 'startDate',
    endDateControl: string = 'endDate'): ValidatorFn {
    return (control: FormControl): ValidationErrors => {
        const startControl = control.get(startDateControl) as FormControl;
        const endControl = control.get(endDateControl) as FormControl;
        if (startControl && endControl) {
            if (startControl.hasError('dateRangeError')) {
                delete startControl.errors['dateRangeError'];
                startControl.updateValueAndValidity({emitEvent: false, onlySelf: true});
            }
            if (endControl.hasError('dateRangeError')) {
                delete endControl.errors['dateRangeError'];
                endControl.updateValueAndValidity({emitEvent: false, onlySelf: true});
            }
            if (startControl.errors || endControl.errors) {
                return;
            }

            if (startControl && startControl.value && endControl && endControl.value) {
                const start = moment(startControl.value, 'DD/MM/YYYY');
                const end = moment(endControl.value, 'DD/MM/YYYY');

                if (start.isSameOrAfter(end)) {
                    startControl.setErrors({ dateRangeError: true });
                    endControl.setErrors({ dateRangeError: true });
                    control.markAllAsTouched();
                } else {
                    control.markAsUntouched();
                }
            }
        }
        return null;
    };
}
