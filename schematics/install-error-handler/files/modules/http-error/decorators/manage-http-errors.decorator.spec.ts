import { HttpErrorResponse } from '@angular/common/http';
import { throwError, of } from 'rxjs';
import { HandleHttpErrors, ExcludeHttpErrorsHandling } from './manage-http-errors.decorator';

describe('http error handler decorator', () => {
    it('should passThrow the error', (done) => {
        @HandleHttpErrors()
        class Test1 {
            test() {
                return throwError(new HttpErrorResponse({status: 409}));
            }
        }
        const test1 = new Test1();
        test1.test().subscribe(() => {}, (error: HttpErrorResponse) => {
            expect(error.status).toBe(409);
            done();
        });
    });

    it('should passThrow the error with simple exclude decorator', (done) => {
        @HandleHttpErrors()
        class Test1 {
            @ExcludeHttpErrorsHandling([409])
            test() {
                return throwError(new HttpErrorResponse({status: 409}));
            }
        }
        const test1 = new Test1();
        test1.test().subscribe(() => {}, (error: HttpErrorResponse) => {
            expect(error.status).toBe(409);
            done();
        });
    });

    it('should return value with exclude and catch decorator', (done) => {
        @HandleHttpErrors()
        class Test1 {
            @ExcludeHttpErrorsHandling([409], 'value')
            test() {
                return throwError(new HttpErrorResponse({status: 409}));
            }
        }
        const test1 = new Test1();
        test1.test().subscribe(value => {
            expect(value).toBe('value');
            done();
        });
    });

    it('should return value with exclude and catch decorator -> null', (done) => {
        @HandleHttpErrors()
        class Test1 {
            @ExcludeHttpErrorsHandling([409], null)
            test() {
                return throwError(new HttpErrorResponse({status: 409}));
            }
        }
        const test1 = new Test1();
        test1.test().subscribe(value => {
            expect(value).toBe(null);
            done();
        });
    });

    it('should return value with exclude and catch decorator -> observable', (done) => {
        @HandleHttpErrors()
        class Test1 {
            @ExcludeHttpErrorsHandling([409], of('value'))
            test() {
                return throwError(new HttpErrorResponse({status: 409}));
            }
        }
        const test1 = new Test1();
        test1.test().subscribe(value => {
            expect(value).toBe('value');
            done();
        });
    });

    it('should return value with advanced exclude and catch decorator', (done) => {
        @HandleHttpErrors()
        class Test1 {
            @ExcludeHttpErrorsHandling([409], () => 'value')
            test() {
                return throwError(new HttpErrorResponse({status: 409}));
            }
        }
        const test1 = new Test1();
        test1.test().subscribe(value => {
            expect(value).toBe('value');
            done();
        });
    });

    it('should return value with advanced exclude and catch decorator -> null', (done) => {
        @HandleHttpErrors()
        class Test1 {
            @ExcludeHttpErrorsHandling([409], () => null)
            test() {
                return throwError(new HttpErrorResponse({status: 409}));
            }
        }
        const test1 = new Test1();
        test1.test().subscribe(value => {
            expect(value).toBe(null);
            done();
        });
    });

    it('should return value with advanced exclude and catch decorator -> observable', (done) => {
        @HandleHttpErrors()
        class Test1 {
            @ExcludeHttpErrorsHandling([409], () => of('value'))
            test() {
                return throwError(new HttpErrorResponse({status: 409}));
            }
        }
        const test1 = new Test1();
        test1.test().subscribe(value => {
            expect(value).toBe('value');
            done();
        });
    });

    it('should return value with advanced exclude and catch decorator -> error', (done) => {
        @HandleHttpErrors()
        class Test1 {
            @ExcludeHttpErrorsHandling([409], () => throwError('errorTest'))
            test() {
                return throwError(new HttpErrorResponse({status: 409}));
            }
        }
        const test1 = new Test1();
        test1.test().subscribe(() => {}, error => {
            expect(error).toBe('errorTest');
            done();
        });
    });

    it('should passThrow the error with simple exclude decorator', (done) => {
        @HandleHttpErrors()
        class Test1 {
            @ExcludeHttpErrorsHandling([408], 'value')
            test() {
                return throwError(new HttpErrorResponse({status: 409}));
            }
        }
        const test1 = new Test1();
        test1.test().subscribe(() => {}, (error: HttpErrorResponse) => {
            expect(error.status).toBe(409);
            done();
        });
    });

});
