import { AbstractControl } from '@angular/forms';

export function getRegExStringFromValidationName(validationName: string): string {
    const RegularExpression = {
        name: {
            CharAllowed: 'a-zA-Z\-\'À-ÿ '
        },
        digitsOnly: {
            CharAllowed: '0-9'
        },
        noSpaces: {
            CharAllowed: '\\S'
        }
    };
    const regEx = RegularExpression[validationName].CharAllowed;
    return regEx;
}

export function isTechnicalKeys(event: KeyboardEvent) {
    return event.key.length > 1 || event.metaKey || event.ctrlKey;
}

/**
 * Verify and block a entered character when the keypress event is emitted.
 * @param event A KeyboardEvent
 * @param validationName The name of the regex (getRegExStringFromValidationName)
 */
export function checkSpecialCharacters(event: KeyboardEvent, validationName: string) {
    const regEx = getRegExStringFromValidationName(validationName);
    const inputChar = event.key;
    const patternTextAllowed = new RegExp(!regEx.startsWith('\\') ? `[${regEx}]` : regEx);

    if (!patternTextAllowed.test(inputChar) && !isTechnicalKeys(event)) {
      event.preventDefault();
    }
  }

  /**
  * Verify and delete characters that shouldn't be on the pasteboard
  * @param event A ClipboardEvent
  * @param formControl The control how past the value
  * @param validationName The name of the regex (getRegExStringFromValidationName)
  */
  export function blockPastSpecialCharracters(event: ClipboardEvent, formControl: AbstractControl, validationName: string) {
    if (!formControl) { return; }
    const regEx = getRegExStringFromValidationName(validationName);
    const patternTextAllowed = new RegExp(`^[${regEx}]*$`);
    const pasteData = event.clipboardData.getData('text/plain');
    if (!patternTextAllowed.test(pasteData)) {
      const regExReplace = new RegExp(`[^${regEx}]`, 'g');
      const replaced = pasteData.replace(regExReplace, '');
      formControl.setValue(replaced);
      event.preventDefault();
    }
  }
