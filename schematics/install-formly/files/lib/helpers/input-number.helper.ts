import { ElementRef } from '@angular/core';
import { AbstractControl } from '@angular/forms';

export function onKeyDown(event: KeyboardEvent, numberInput: ElementRef, withDecimal: number): void {
    if (event.key === 'e' ||
        event.key === 'E' ||
        event.key === '-' ||
        event.key === '+' ||
        event.key === '`' ||
        event.key === '^') {
        event.preventDefault();
    }
    if (event.key === ',' || event.key === '.') {
        if (!withDecimal) {
            event.preventDefault();
        } else if (numberInput.nativeElement.value === '') {
            event.preventDefault();
        }
    }
}
export function onInput(event: InputEvent, formControl: AbstractControl, maxLength: number, withDecimal: number): void {
    const currentValue = formControl.value?.toString();
    if (currentValue?.length ?? 0 > maxLength) {
        formControl.setValue(+(currentValue.slice(0, maxLength)));
    }
    if (withDecimal) {
        const decimalPrecision = Math.pow(10, withDecimal);
        const tester = new RegExp(`[.,]\\d{${withDecimal + 1}}`);
        if (tester.test(formControl.value)) {
            formControl.setValue(Math.floor(formControl.value * decimalPrecision) / decimalPrecision);
            event.preventDefault();
        }
    }
}

export function onPaste(event: ClipboardEvent, formControl: AbstractControl, withDecimal: number): void {
    const clipboardData: DataTransfer = event.clipboardData || window['clipboardData'];
    const toPaste = clipboardData.getData('text/plain');
    if (!withDecimal) {
        if (!/^\d*$/.test(toPaste)) {
            event.preventDefault();
        }
    } else {
        if (/^[0-9.,]*$/.test(toPaste)) {
            formControl.setValue(parseFloat(toPaste.replace(',', '.')).toFixed(withDecimal));
        }
        event.preventDefault();
    }
}
