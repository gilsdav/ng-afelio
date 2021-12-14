import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProxyServiceGen } from '@fcsd-daenae/AddressApi';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormlyExtension, FormlyFieldConfig, FormlyModule, FORMLY_CONFIG } from '@ngx-formly/core';
import { FormlySelectModule } from '@ngx-formly/core/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AutosizeModule } from 'ngx-autosize';
import { BsDatepickerModule } from 'ngx-bootstrap';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { NgxMaskModule } from 'ngx-mask';
import { directives } from '../directives/index';
import { DaenaePipesModule } from '../pipes/daenae-pipes.module';
import { FormlyDropdownComponent } from './formly-dropdown/formly-dropdown.component';
import { FormlyModalComponent } from './formly-modal/formly-modal.component';
import {
    ButtonComponent,
    ContextualMenuComponent,
    DatepickerComponent,
    EmailComponent,
    MulticheckboxComponent,
    MultiselectComponent,
    NumberComponent,
    PhoneComponent,
    SelectComponent,
    SwitchComponent,
    TextareaComponent,
    TextComponent,
    ToggleComponent
} from './templates';
import { AddressComponent } from './templates/address/address.component';
import { AddressAutocompleteComponent } from './templates/address/components/address-autocomplete/address-autocomplete.component';
import { AddressFormComponent } from './templates/address/components/address-form/address-form.component';
import { AddressService } from './templates/address/services/address.service';
import { StatisticalDistrictService } from './templates/address/services/statistical-district.service';
import { ComponentComponent } from './templates/component/component.component';
import { DatepickerSubComponent } from './templates/datepicker/component/datepicker-sub.component';
import { HourInputComponent } from './templates/hour-input/hour-input.component';
import { InamiInputComponent } from './templates/inami-input/inami-input.component';
import { NameInputComponent } from './templates/name-input/name-input.component';
import { NissInputComponent } from './templates/niss-input/niss-input.component';
import { PercentageComponent } from './templates/percentage/percentage.component';
import { PriceComponent } from './templates/price/price.component';
import { RepeatFormlyGroupComponent } from './templates/repeat-formly-group/repeat-formly-group.component';
import { SearchableSelectComponent } from './templates/searchable-select/searchable-select.component';
import { SimpleCheckboxComponent } from './templates/simple-checkbox/simple-checkbox.component';
import { TextInformationComponent } from './templates/text-information/text-information.component';
import { TextNumberComponent } from './templates/text-number/text-number.component';
import { FormlySwitchListValidatorRequired } from './validators/formly-switch-list.validator';
import {
    DivideSectionWrapperComponent, HelpPlanWrapperComponent, RowWrapperComponent, SectionWrapperComponent,
    SimpleFieldWrapperComponent
} from './wrappers';
import { ListWrapperComponent } from './wrappers/list-wrapper/list-wrapper.component';
import { PopinWrapperComponent } from './wrappers/popin-wrapper/popin-wrapper.component';


export function formlyValidationConfig(translate: TranslateService) {
    return {
      validationMessages: [
        {
          name: 'required',
          message() {
            return translate.stream('FORM.VALIDATION.REQUIRED');
          },
        },
        {
            name: 'min',
            message: (error, field: FormlyFieldConfig) => {
                return translate.stream(field.templateOptions.errorMessages ?
                    field.templateOptions.errorMessages.min :
                    'FORM.VALIDATION.NUMBER_LOWER_THAN', {min : error.min});
            }
        },
        {
            name: 'max',
            message: (error, field: FormlyFieldConfig) => {
                return translate.stream(field.templateOptions.errorMessages ?
                    field.templateOptions.errorMessages.max :
                    'FORM.VALIDATION.NUMBER_BIGGER_THAN', {max : error.max});
            }
        },
        {
            name: 'outOfRange',
            message(error, field: FormlyFieldConfig) {
                return translate.stream(
                    field.templateOptions.errorMessages.outOfRange,
                    {
                        min : field.templateOptions.min,
                        max : field.templateOptions.max
                    }
                );
            }
        },
        {
            name: 'dateRangeError',
            message() {
              return translate.stream('FORM.VALIDATION.ULTERIOR_DATE');
            }
        },
        {
            name: 'invalidDate',
            message() {
              return translate.stream('FORM.VALIDATION.INVALIDDATE');
            }
        },
        {
            name: 'dateTooBig',
            message(a: Date) {
              return translate.stream('FORM.VALIDATION.DATETOOBIG', {date : a.toLocaleDateString()});
            }
        },
        {
            name: 'dateTooSmall',
            message(a: Date) {
                return translate.stream('FORM.VALIDATION.DATETOOSMALL', {'date' : a.toLocaleDateString()});
            }

        },
        {
            name: 'switchRequired',
            message() {
                return translate.stream('FORM.VALIDATION.SWITCH_LIST_REQUIRED');
            }
        },
        {
            name: 'phoneError',
            message() {
                return translate.stream('FORM.VALIDATION.PHONE_ERROR');
            }
        },
        {
            name: 'emailInvalid',
            message() {
                return translate.stream('FORM.VALIDATION.EMAIL_ERROR');
            }
        },
        {
            name: 'invalidHour',
            message() {
                return translate.stream('FORM.VALIDATION.TIME_FORMAT_ERROR');
            }
        },
        {
            name: 'incoherentHours',
            message() {
                return translate.stream('FORM.VALIDATION.HOURS_INCOHERENT');
            }
        },
        {
            name: 'minChoice',
            message(min: number) {
                return translate.stream('FORM.VALIDATION.MINIMUM_CHOICE', { min });
            }
        },
        {
            name: 'minLength',
            message(min: number) {
                return translate.stream('FORM.VALIDATION.MINIMUM_LENGTH', { min });
            }
        },
        {
            name: 'invalidInami',
            message() {
                return translate.stream('FORM.VALIDATION.INAMI_NUMBER_ERROR');
            }
        }
      ]
    };
}

let postPopulateFormeHookTimeout = null;
export function postPopulateFormeHook(field: FormlyFieldConfig) {
    if (
        field.parent &&
        !field.parent.parent &&
        field.templateOptions?.postPopulateForm &&
        !field.templateOptions._postPopulateFormCalled
    ) {
        // Debounce
        if (postPopulateFormeHookTimeout) {
            clearTimeout(postPopulateFormeHookTimeout);
            postPopulateFormeHookTimeout = null;
        }
        postPopulateFormeHookTimeout = setTimeout(() => {
            field.templateOptions.postPopulateForm(field);
            field.templateOptions._postPopulateFormCalled = true;
            postPopulateFormeHookTimeout = null;
        }, 0);
    }
}
export const formPopulateHookExtension: FormlyExtension = {
    postPopulate: postPopulateFormeHook
};

@NgModule({
    declarations: [
        SimpleFieldWrapperComponent,
        SectionWrapperComponent,
        RepeatFormlyGroupComponent,
        ListWrapperComponent,
        ToggleComponent,
        SelectComponent,
        EmailComponent,
        TextComponent,
        NameInputComponent,
        SwitchComponent,
        TextareaComponent,
        SimpleCheckboxComponent,
        InamiInputComponent,
        MulticheckboxComponent,
        DatepickerComponent,
        PhoneComponent,
        DatepickerSubComponent,
        NumberComponent,
        PriceComponent,
        TextInformationComponent,
        ContextualMenuComponent,
        ButtonComponent,
        AddressComponent,
        AddressAutocompleteComponent,
        AddressFormComponent,
        HourInputComponent,
        ComponentComponent,
        PopinWrapperComponent,
        HelpPlanWrapperComponent,
        PercentageComponent,
        FormlyModalComponent,
        MultiselectComponent,
        NissInputComponent,
        SearchableSelectComponent,
        DivideSectionWrapperComponent,
        RowWrapperComponent,
        TextNumberComponent,
        FormlyDropdownComponent,
        ...directives
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatTooltipModule,
        TranslateModule,
        FormsModule,
        NgxMaskModule.forRoot(),
        PopoverModule.forRoot(),
        FormlyModule.forChild({
            extras: { lazyRender: true },
            extensions: [
                { name: 'form-populate-hook', extension: formPopulateHookExtension },
            ],
            validators: [
                { name: 'switch-list-required', validation: FormlySwitchListValidatorRequired }
            ],
            wrappers: [
                { name: 'simple-field-wrapper', component: SimpleFieldWrapperComponent },
                { name: 'section-wrapper', component: SectionWrapperComponent },
                { name: 'list-wrapper', component: ListWrapperComponent },
                { name: 'popin-wrapper', component: PopinWrapperComponent },
                { name: 'help-plan-wrapper', component: HelpPlanWrapperComponent },
                { name: 'divide-section-wrapper', component: DivideSectionWrapperComponent },
                { name: 'row-wrapper', component: RowWrapperComponent }
            ],
            types: [
                { name: 'toggle', component: ToggleComponent, wrappers: ['simple-field-wrapper']},
                { name: 'switch', component: SwitchComponent, wrappers: ['simple-field-wrapper']},
                { name: 'textarea', component: TextareaComponent, wrappers: ['simple-field-wrapper']},
                { name: 'datepicker', component: DatepickerComponent, wrappers: ['simple-field-wrapper']},
                { name: 'email', component: EmailComponent, wrappers: ['simple-field-wrapper']},
                { name: 'phone', component: PhoneComponent, wrappers: ['simple-field-wrapper']},
                { name: 'simplecheckbox', component: SimpleCheckboxComponent, wrappers: ['simple-field-wrapper']},
                { name: 'multicheckbox', component: MulticheckboxComponent, wrappers: ['simple-field-wrapper']},
                { name: 'select', component: SelectComponent, wrappers: ['simple-field-wrapper']},
                { name: 'multiselect', component: MultiselectComponent, wrappers: ['simple-field-wrapper']},
                { name: 'searchable-select', component: SearchableSelectComponent, wrappers: ['simple-field-wrapper']},
                { name: 'integer', component: NumberComponent, wrappers: ['simple-field-wrapper']},
                { name: 'price', component: PriceComponent, wrappers: ['simple-field-wrapper']},
                { name: 'textinformation', component: TextInformationComponent, wrappers: ['simple-field-wrapper']},
                { name: 'text', component: TextComponent, wrappers: ['simple-field-wrapper']},
                { name: 'inami', component: InamiInputComponent, wrappers: ['simple-field-wrapper']},
                { name: 'name-input', component: NameInputComponent, wrappers: ['simple-field-wrapper']},
                { name: 'contextual-menu', component: ContextualMenuComponent, wrappers: []},
                { name: 'button', component: ButtonComponent, wrappers: []},
                { name: 'address', component: AddressComponent, wrappers: []},
                { name: 'hour-input', component: HourInputComponent, wrappers: ['simple-field-wrapper']},
                { name: 'repeat', component: RepeatFormlyGroupComponent, wrappers: [] },
                { name: 'component', component: ComponentComponent, wrappers: [] },
                { name: 'percent', component: PercentageComponent, wrappers: ['simple-field-wrapper'] },
                { name: 'niss', component: NissInputComponent, wrappers: ['simple-field-wrapper'] },
                { name: 'text-number', component: TextNumberComponent, wrappers: ['simple-field-wrapper']}
            ]
        }),
        BsDatepickerModule.forRoot(),
        FormlySelectModule,
        MatAutocompleteModule,
        AutosizeModule,
        DaenaePipesModule,
        NgSelectModule
    ],
    providers: [
        { provide: FORMLY_CONFIG, multi: true, useFactory: formlyValidationConfig, deps: [TranslateService] },
        AddressService,
        StatisticalDistrictService,
        ProxyServiceGen
    ],
    exports: [
        ToggleComponent,
        MulticheckboxComponent,
        SelectComponent,
        EmailComponent,
        SwitchComponent,
        PhoneComponent,
        TextareaComponent,
        InamiInputComponent,
        DatepickerComponent,
        NumberComponent,
        PriceComponent,
        SimpleFieldWrapperComponent,
        ReactiveFormsModule,
        FormlyModule,
        ContextualMenuComponent,
        ButtonComponent,
        AddressComponent,
        ComponentComponent,
        DaenaePipesModule,
        FormlyModalComponent,
        MultiselectComponent,
        SearchableSelectComponent,
        DivideSectionWrapperComponent,
        TextNumberComponent,
        FormlyDropdownComponent
    ]
})
export class FormlyComponentsModule {}
