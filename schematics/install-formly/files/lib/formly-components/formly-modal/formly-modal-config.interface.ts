import { FormlyModalSizeEnum } from '@fcsd-daenae/form-components';
import { FormGeneratorResult } from '../interfaces/form-generator-result.interface';
export interface IFormlyModalAction {
    label: string;
    key: string;
    icon?: string;
    className?: string;
}
export interface FormlyModalConfig {
    formConfig: FormGeneratorResult;
    actions?: IFormlyModalAction[];
    labels: {
        title: string,
        cancel: string,
        submit: string
    };
    size?: FormlyModalSizeEnum.Normal | FormlyModalSizeEnum.Large;
}
