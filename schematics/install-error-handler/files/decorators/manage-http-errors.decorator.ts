import { HttpErrorResponse } from '@angular/common/http';
import { Type } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchErrorHandlerOperator, ErrorHandlerResultType } from '../operators/catch-error-handler.operator';

//#region prerequis
const localExclusionKey = '__duf_toExclude__';
const localExclusionReactionKey = '__duf_ExclusionReaction__';
const localIngoreKey = '__duf_toIngore__';

function fixMissingPrototype(value: any) {
    if (!value.prototype) {
        value.prototype = {};
    }
}
//#endregion prerequis

/**
 * HandleHttpErrors will handle http errors of all your functions in a the service where this decorator is applied.
 * It will show the errors in a toast.
 *
 * Static, lambda (arrow) and constructor functions are not supported by this handler and will be **ignored**.
 *
 * *This is applied after each manipulation on your function. Using `catchError` will bypass this default handler.*
 *
 * ### Example
 * ```
 * @HandleHttpErrors()
 * @Injectable()
 * export class MyService {}
 * ```
 *
 * @param errorCodesToExclude http codes/status to excluse from this default handler
 * @param prefixToExclude prefix name of functions to excluse from this default handler
 */
export function HandleHttpErrors(errorCodesToExclude: number[] = [], prefixToExclude = '_') {
    return (constructorFn: Type<any>) => {
        const functionNames = Object.keys(Object.getOwnPropertyDescriptors(constructorFn.prototype));

        functionNames.forEach(fnKey => {
            if (!fnKey.startsWith(prefixToExclude) && fnKey !== 'constructor') {

                const oldFn: (...args: any[]) => Observable<any> = constructorFn.prototype[fnKey];
                const oldFnPrototype = oldFn.prototype || {};

                const ignoreThisFunction: boolean = oldFnPrototype[localIngoreKey];
                if (!ignoreThisFunction) {

                    const errorCodesToExcludeLocally: number[] = oldFnPrototype[localExclusionKey] || [];
                    const localExclusionReaction: ErrorHandlerResultType<any> = oldFnPrototype[localExclusionReactionKey];
                    const codesToExclude = [...errorCodesToExclude, ...errorCodesToExcludeLocally];

                    constructorFn.prototype[fnKey] = function(...args: any[]) {
                        let fnResult = oldFn.call(this, ...args);
                        const isObservable = fnResult && typeof fnResult.pipe === 'function';

                        if (isObservable) {
                            fnResult = fnResult.pipe(
                                catchErrorHandlerOperator(
                                    (error: HttpErrorResponse) => {
                                        if (errorCodesToExcludeLocally.includes(error.status) && localExclusionReaction !== undefined) {
                                            return typeof localExclusionReaction === 'function' ?
                                                localExclusionReaction(error) :
                                                localExclusionReaction;
                                        } else {
                                            return throwError(error);
                                        }
                                    }, (error: HttpErrorResponse) => {
                                        return !codesToExclude.includes(error.status);
                                    }
                                )
                            );
                        }
                        return fnResult;
                    };

                }

            }

        });

    };
}

/**
 * Excluse specifit codes/status from default handler (`@HandleHttpErrors()`).
 * It will only affect the linked function.
 *
 * ### Example
 * ```
 * @ExcludeHttpErrorsHandling([400])
 * public getData(): Observable<any>{}
 * ```
 *
 * @param errorCodes http codes/status to excluse from this default handler
 * @param errorCatching you can catch excluded errors and return a value for the new observable
 * Exemple1: `null`,
 * Exemple2: `error => error.status === 409 ? [] : null`,
 * Exemple3: `error => throwError(error)`.
 */
export function ExcludeHttpErrorsHandling(errorCodes: number[], errorCatching?: ErrorHandlerResultType<any>) {
    return (
        target: object,
        propertyKey: string,
        propertyDescriptor: TypedPropertyDescriptor<any>
    ) => {
        if (errorCodes && errorCodes.length > 0) {
            fixMissingPrototype(propertyDescriptor.value);
            propertyDescriptor.value.prototype[localExclusionKey] = errorCodes;
            if (errorCatching !== undefined) {
                propertyDescriptor.value.prototype[localExclusionReactionKey] = errorCatching;
            }
        }
        return propertyDescriptor;
    };
}

/**
 * Ask `HandleHttpErrors()` to ignore the linked function.
 *
 * ### Example
 * ```
 * @IgnoreHttpErrorsHandling()
 * public getData(): Observable<any>{}
 * ```
 */
export function IgnoreHttpErrorsHandling() {
    return (
        target: object,
        propertyKey: string,
        propertyDescriptor: TypedPropertyDescriptor<any>
    ) => {
        fixMissingPrototype(propertyDescriptor.value);
        propertyDescriptor.value.prototype[localIngoreKey] = true;
        return propertyDescriptor;
    };
}
