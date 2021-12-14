import { FormControl } from '@angular/forms';
import { isNil } from 'lodash';

export class PriceRangeValidator {
    static outOfRange(
        range: { min?: number, max?: number }
    ) {
        return (control: FormControl): { [key: string]: any } => {
            let result = null;
            const value = parseInt(control.value, 10);
            if (!isNaN(value) && (!isNil(range.min) || !isNil(range.max))) {
                if ((!isNil(range.min) && value < range.min) || (!isNil(range.max) && value > range.max)) {
                    result = {
                        outOfRange: true
                    };
                }
            }
            return result;
        };
    }
}
