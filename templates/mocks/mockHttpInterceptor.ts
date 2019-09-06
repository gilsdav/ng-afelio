import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

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

        const foundMock: Mock = mocks.find(
            mock => url.includes(mock.url) &&
            method === mock.methods &&
            (environment.mock.services[mock.name] || environment.mock.all)
        );

        if (foundMock) {
            let mockExecution = this.executeMock(request, foundMock.response);
            if (foundMock.delay) {
                mockExecution = mockExecution.pipe(delay(foundMock.delay));
            }
            return mockExecution;
        } else {
            return next.handle(request);
        }

    }

    private executeMock(request, response): Observable<HttpEvent<any>> {
        const result = response(request);
        return result instanceof Observable ? result : of(result);
    }

}

export const mockInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: MockHttpInterceptor,
    multi: true
};

export interface Mock {
    url: string;
    methods: string;
    name: string;
    response: (request: any) => Observable<HttpResponse<any>> | HttpResponse<any>;
    delay?: number;
}
