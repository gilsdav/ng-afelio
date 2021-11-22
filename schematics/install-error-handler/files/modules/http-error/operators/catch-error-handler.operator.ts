import { HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ObjectHelper } from '../../../helpers/object.helper';

export const ERROR_MESSAGE_CHANNEL = `__duf_httpError__${ObjectHelper.generateUUIDv4()}`;

const messageChannel = new BroadcastChannel(ERROR_MESSAGE_CHANNEL);
type CustomHandlerType = (error: HttpErrorResponse) => boolean;
type DataType = boolean|number|string|object;
type ResultTypeData = DataType|DataType[];
type ResultTypeDataExt<T extends ResultTypeData> = T;
type ResultTypeFunc<T extends ResultTypeData> = (error: HttpErrorResponse) => T;
type ResultTypeFuncObs<T extends ResultTypeData> = (error: HttpErrorResponse) => Observable<T>;
type ResultTypeDataObs<T extends ResultTypeData> = Observable<T>;
export type ErrorHandlerResultType<T extends ResultTypeData> = ResultTypeFuncObs<T> | ResultTypeDataObs<T> |
    ResultTypeFunc<T> | ResultTypeDataExt<T>;

/**
 * Extension of catchError RXJS Operator. It allows you to handle default error handler when using catchError.
 * @param result value of new observable.
 * Exemple1: `null`,
 * Exemple2: `error => error.status === 409 ? [] : null`,
 * Exemple3: `error => throwError(error)`.
 * @param customHandler lambda that compute if default handler must do the job. Return `true` to execute default handler.
 * Exemple: `(error) => error !== 409`.
 * Default: `() => true`
 */
export function catchErrorHandlerOperator<T extends ResultTypeData>(
    result: ErrorHandlerResultType<T>,
    customHandler: CustomHandlerType = () => true
) {
    return catchError<T, Observable<T>>((error: HttpErrorResponse) => {
        // Handle error
        if (customHandler(error)) {
            const err: any = error;
            if (typeof err.error === 'string') {
                try {
                    const objectError: any = JSON.parse(error.error);
                    if (objectError) {
                        err.error = objectError;
                    }
                } catch (e) {
                }
            }
            messageChannel.postMessage(JSON.stringify(err));
        }
        // Compute response
        let tempResponse: any;
        if (typeof result === 'function') {
            tempResponse = (result as (error: HttpErrorResponse) => any)(error);
        } else {
            tempResponse = result;
        }
        // Bundle into observable
        const isObservable = tempResponse && (tempResponse instanceof Observable || typeof tempResponse.pipe === 'function');
        let response: Observable<T>;
        if (isObservable) {
            response = tempResponse;
        } else {
            response = of(tempResponse);
        }
        return response;
    });
}
