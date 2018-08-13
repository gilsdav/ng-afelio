import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { mocks } from './mocks';
import { environment } from '../environments/environment';

/**
 * Generated file, do not do not modify it.
 */
@Injectable()
export class MockHttpInterceptor implements HttpInterceptor {
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const url: string = request.url;
        const method: string = request.method;

        const foundMock = mocks.find(
            mock => url.includes(mock.url) &&
            method === mock.methods &&
            environment.mock.services[mock.name] || environment.mock.all
        );

        if (foundMock) {
            return this.executeMock(request, foundMock.response);
        } else {
            return next.handle(request);
        }

    }

    private executeMock(request, response): Observable<HttpEvent<any>> {
        const result = response(request);
        return of(result);
    }

}

export const mockInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: MockHttpInterceptor,
    multi: true
};
