import { TestBed } from '@angular/core/testing';

import { BlobErrorInterceptor } from './blob-error.interceptor';

describe('BlobErrorInterceptorService', () => {
    let service: BlobErrorInterceptor;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(BlobErrorInterceptor);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
