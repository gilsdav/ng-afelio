import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { Mock, MockOthers } from './mock.model';
import { mocks } from './mocks';

/**
 * Generated file, do not do not modify it.
 */
@Injectable()
export class MockHttpInterceptor implements HttpInterceptor {
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const method: string = request.method;
        let matches: RegExpMatchArray | undefined;
        let isAngularPath = false;

        const foundMock: Mock | undefined = mocks.find(
            mock => {
                let isIncluded = false;
                const url = mock.checkQueryParams ? request.urlWithParams : request.url;
                let mockUrl: RegExp | undefined;
                if (typeof mock.url === 'string') {
                    if ((mock as MockOthers).angularPathMatcher) {
                        mockUrl = this.stringToRegexp(mock.url);
                        isAngularPath = true;
                    } else {
                        isIncluded = url.includes(mock.url as string);
                    }
                } else {
                    mockUrl = mock.url;
                }

                if (mockUrl) {
                    matches = url.match(mockUrl) || undefined;
                    isIncluded = !!matches;
                }
                return isIncluded &&
                    method === mock.methods &&
                    ((environment.mock.services as { [key: string]: boolean })[mock.name] || environment.mock.all);
            }
        );

        if (foundMock) {
            let mockExecution = this.executeMock(request, foundMock.response, isAngularPath ? matches?.groups : matches);
            if (foundMock.delay) {
                mockExecution = mockExecution.pipe(delay(foundMock.delay));
            }
            const mockReturnLogger = (response: any) => console.log(
                `%c Mock returned for ${request.urlWithParams}`,
                'color: #bbb', { request: request, response: response }
            );
            return mockExecution.pipe(tap(mockReturnLogger, mockReturnLogger));
        } else {
            return next.handle(request);
        }

    }

    private executeMock(
        request: HttpRequest<any>,
        response: (request: HttpRequest<any>, matches?: RegExpMatchArray & { [key: string]: string }) => any,
        matches?: RegExpMatchArray | { [key: string]: string }
    ): Observable<HttpEvent<any>> {
        const result = response(request, matches as RegExpMatchArray & { [key: string]: string });
        return result instanceof Observable ? result : of(result);
    }

    private stringToRegexp(url: string): RegExp {
        const splitParams = url.split('?');
        const segments = splitParams[0].split('/');

        const transformedSegments = segments.map(s => {
            if (s.startsWith(':')) {
                return `(?<${s.substring(1)}>[^/]+)`;
            }
            return s;
        });

        return new RegExp(transformedSegments.join('/'), 'i');
    }
}

export const mockInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: MockHttpInterceptor,
    multi: true
};
