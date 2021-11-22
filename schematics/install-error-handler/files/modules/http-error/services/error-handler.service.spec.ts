import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { ErrorHandlerService } from './error-handler.service';

class MockedTranslateService {
    get(key: string) {
        return of(key);
    }
    instant(key: string, data?: {code: number}) {
        return data && data.code || '';
    }
}
<% if(useNgxToastr) { %>
class MockedToastrService {
    error(...args: any[]) {}
}<% } %>

class MockedZone {
    runOutsideAngular(fn: (...args: any[]) => void): void {
        fn();
    }
    run(fn: (...args: any[]) => void, applyThis?: any, applyArgs?: any[]): void {
        fn();
    }
}

describe('ErrorHandlerService', () => {
    let service: ErrorHandlerService;

    beforeEach(() => {
        service = new ErrorHandlerService(<% if(useNgxToastr) { %>
            new MockedToastrService() as any,<% } %>
            { enable: true, codesToExclude: [409] },
            new MockedZone() as any
        );
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    it('show service error message', () => {
        const serviceErrorSpy = spyOn(service as any, 'displayServiceError');
        const connectionErrorSpy = spyOn(service as any, 'displayConnectionError');
        service.handleError(new HttpErrorResponse({ status: 400 }));
        expect(serviceErrorSpy).toHaveBeenCalled();
        expect(connectionErrorSpy).not.toHaveBeenCalled();
    });

    it('show connection error message', () => {
        const serviceErrorSpy = spyOn(service as any, 'displayServiceError');
        const connectionErrorSpy = spyOn(service as any, 'displayConnectionError');
        service.handleError(new HttpErrorResponse({ status: 0 }));
        expect(serviceErrorSpy).not.toHaveBeenCalled();
        expect(connectionErrorSpy).toHaveBeenCalled();
    });

    it('do not show excluded service error message', () => {
        const serviceErrorSpy = spyOn(service as any, 'displayServiceError');
        const connectionErrorSpy = spyOn(service as any, 'displayConnectionError');
        service.handleError(new HttpErrorResponse({ status: 409 }));
        expect(serviceErrorSpy).not.toHaveBeenCalled();
        expect(connectionErrorSpy).not.toHaveBeenCalled();
    });

});
