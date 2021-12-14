import { FormArray, FormGroup, AbstractControl } from '@angular/forms';

export function markAllControlsAsTouched(form: AbstractControl, touched = true, emitEvent = true) {
    if (touched) {
        form.markAsTouched({ onlySelf: true });
    } else {
        form.markAsUntouched({ onlySelf: true });
    }
    form.updateValueAndValidity({ onlySelf: true, emitEvent: emitEvent });

    if ((form instanceof FormGroup || form instanceof FormArray) && form.controls && Object.keys(form.controls).length > 0) {
        for (const inner in form.controls) {
            if (Object.getOwnPropertyNames(inner)) {
                markAllControlsAsTouched(form.get(inner), touched, false);
            }
        }
    }
}
