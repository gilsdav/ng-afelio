/**
 * Scroll to first error on the form
 * @param selector the class used to find the first error (:not(form).ng-invalid by default)
 */
export function scrollToError(selector: string = ':not(form).ng-invalid, .scrollable-error'): void {
    setTimeout(() => {
        const firstElementWithError = document.querySelector(selector);
        if (firstElementWithError) {
            firstElementWithError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 0);
}

