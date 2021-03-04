import { Provider } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, finalize, switchMap, take } from 'rxjs/operators';

import { AuthenticationService } from '../services/authentication.service';

export class AuthenticationInterceptor implements HttpInterceptor {

    private isRefreshing$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(private authService: AuthenticationService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        request = this.addAuthorization(request);
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error && error instanceof HttpErrorResponse && error.status === 401) {
                    return this.handleUnauthorized(request, next);
                }
                return throwError(error);
            })
        );
    }

    private addAuthorization(request: HttpRequest<any>): HttpRequest<any> {
        const token = this.authService.getToken();
        if (token) {
            const header = `Bearer ${token}`;
            const headers = request.headers.set('Authorization', header);
            request = request.clone({ headers });
        }
        return request;
    }

    private handleUnauthorized(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.isRefreshing$.getValue()) {
            this.isRefreshing$.next(true);
            return this.authService.getTokenAsync().pipe(
                take(1),
                switchMap((newToken: string) => {
                    if (newToken) {
                        return next.handle(this.addAuthorization(req));
                    } else {
                        return throwError('No Token received');
                    }
                }),
                finalize(() => {
                    this.isRefreshing$.next(false);
                })
            );
        } else {
            return this.isRefreshing$
                .pipe(
                    filter(isRefreshing => !isRefreshing),
                    take(1),
                    switchMap(() => {
                        return next.handle(this.addAuthorization(req));
                    })
                );

        }
    }
}

export const authenticationInterceptorProvider: Provider = {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthenticationInterceptor,
    multi: true,
    deps: [AuthenticationService]
};
