import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, from, switchMap } from 'rxjs';

/**
 * Interceptor to fix issue (https://github.com/angular/angular/issues/19888) when request of type Blob, the error is also in Blob instead of object of the json data.
 */
@Injectable({
    providedIn: 'root'
})
export class BlobErrorInterceptor implements HttpInterceptor {

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError(err => {
                if (err instanceof HttpErrorResponse && err.error instanceof Blob && err.error.type === "application/json") {
                    // https://github.com/angular/angular/issues/19888
                    // When request of type Blob, the error is also in Blob instead of object of the json data
                    return this.convertBlobErrorToJsonError(err).pipe(
                        switchMap(jsonError => {
                            throw new HttpErrorResponse({
                                ...err as any,
                                url: err.url ?? undefined,
                                error: jsonError
                            })
                        })
                    )
                }
                throw err;
            })
        );
    }

    private convertBlobErrorToJsonError(error: HttpErrorResponse): Observable<any> {
        return from(error.error.text().then((text: string) => {
            let jsonError = JSON.parse(text);
            return jsonError;
        }));
    }

}
