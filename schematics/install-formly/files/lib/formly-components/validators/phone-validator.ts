import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { PrefixPhonesEnum } from './../../../../../../src/app/modules/folder360/enums/prefix-phones.enum';

export class PhoneNumberValidator {


  static phoneNumberValidator(
    prefixKey: string,
    phoneKey: string
  ): ValidatorFn {
    return (group: FormGroup): { [key: string]: any } => {
        const controlPrefix = group.get(prefixKey);
        const controlPhone = group.get(phoneKey);

      if (controlPrefix.value && controlPhone.value) {
        const codeCountry = Object.keys(PrefixPhonesEnum).find(
          key => PrefixPhonesEnum[key].toString() === controlPrefix.value.toString()
        );
        const phoneNumberUtil = PhoneNumberUtil.getInstance();
        if (codeCountry) {
          try {
            const phoneNumber = phoneNumberUtil.parse(
              `${controlPrefix.value} ${controlPhone.value.replace(
                /[^0-9]/g,
                ''
              )}`,
              codeCountry
            );
            const validNumber = phoneNumberUtil.isValidNumberForRegion(
              phoneNumber,
              codeCountry
            );
            return validNumber ? null : { phoneError: true };
          } catch (e) {
            return { phoneError: { value: true } };
          }
        } else {
          return { phoneError: { value: true } };
        }
      } else if (!controlPhone.value) {
        return null;
      } else {
        return { phoneError: { value: true } };
      }
    };
  }
}
