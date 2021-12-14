import { some } from 'lodash';
import { FormControl, ValidationErrors } from '@angular/forms';

    export function FormlySwitchListValidatorRequired(control: FormControl): ValidationErrors {
        if (!control.value) {
            return {switchRequired: true};
        }

        const allNull  = some(Object.keys(control.value), (keyControl) => control.value[keyControl]);

        return allNull ? null : {switchRequired: true};
    }
