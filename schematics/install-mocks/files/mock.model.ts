import { HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface MockRegexp {
    url: RegExp;
    methods: string;
    name: string;
    response: (request: HttpRequest<any>, matches?: RegExpMatchArray) => Observable<HttpResponse<any>> | HttpResponse<any>;
    delay?: number;
    checkQueryParams?: boolean;
}

export interface MockAngular {
    url: string;
    methods: string;
    name: string;
    response: (request: HttpRequest<any>, matches?: { [key: string]: string }) => Observable<HttpResponse<any>> | HttpResponse<any>;
    delay?: number;
    checkQueryParams?: boolean;
    angularPathMatcher: true;
}

export interface MockOthers {
    url: string;
    methods: string;
    name: string;
    response: (request: HttpRequest<any>) => Observable<HttpResponse<any>> | HttpResponse<any>;
    delay?: number;
    checkQueryParams?: boolean;
    angularPathMatcher?: false;
}

export type Mock = MockAngular | MockOthers | MockRegexp;
