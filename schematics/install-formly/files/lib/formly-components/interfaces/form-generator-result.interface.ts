import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormGroup, AbstractControl } from '@angular/forms';

export interface FormGeneratorResult<ModelType = any> {
    formGroup: FormGroup;
    formlyConfig: FormlyFieldConfig[];
    model: ModelType;
    formState?: any;
}


export interface SubFormGeneratorResult<ModelType = any> {
    formGroup:  {[key: string]: AbstractControl};
    formlyConfig: FormlyFieldConfig[];
    model: ModelType;
}
