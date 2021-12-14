import { PhoneTypeEnum } from 'global-models/enums';
import { PhoneNumberUtil, PhoneNumber, PhoneNumberType, PhoneNumberFormat } from 'google-libphonenumber';

export function transformPhoneAsStringToPhoneNumber(phoneNumber: string, codeCountry: string = 'BE'): PhoneNumber {
  const phoneNumberUtil = PhoneNumberUtil.getInstance();
  return phoneNumberUtil.parse(phoneNumber, codeCountry);
}

export function getPhoneNumberNational(phoneNumberToParse: string): { countryCode, phoneNumber } {
  const phoneNumberUtil = PhoneNumberUtil.getInstance();
  try {
    const phoneNumber = phoneNumberUtil.parseAndKeepRawInput(phoneNumberToParse, null);
    const countryCode = phoneNumberUtil.getRegionCodeForNumber(phoneNumber);
    const phone = phoneNumber.getNationalNumber().toString();

    return {
      countryCode: countryCode,
      phoneNumber: phone
    };
  } catch (exception) {
    return {
      countryCode: 'BE',
      phoneNumber: phoneNumberToParse
    };
  }

}

export function isPhoneNumberValid(phoneNumber: PhoneNumber, codeCountry: string = 'BE'): boolean {
  const phoneNumberUtil = PhoneNumberUtil.getInstance();
  return phoneNumberUtil.isValidNumberForRegion(phoneNumber, codeCountry);
}

export function getPhoneType(phoneNumber: PhoneNumber): PhoneTypeEnum {
  const phoneNumberUtil = PhoneNumberUtil.getInstance();
  const typePhone = phoneNumberUtil.getNumberType(phoneNumber);
  if (typePhone === PhoneNumberType.FIXED_LINE) {
    return PhoneTypeEnum.Fix;
  } else if (typePhone === PhoneNumberType.MOBILE) {
    return PhoneTypeEnum.Mobile;
  }
}

export function formatPhoneNumberInternational(phoneNumber: string): string {
  const phoneNumberUtil = PhoneNumberUtil.getInstance();
  return phoneNumberUtil.format(phoneNumberUtil.parse(phoneNumber),
    PhoneNumberFormat.INTERNATIONAL)
    .replace(/[^0-9+]/g, '');
}
