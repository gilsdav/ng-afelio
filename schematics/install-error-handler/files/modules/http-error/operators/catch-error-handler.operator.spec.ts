import { catchErrorHandlerOperator, ERROR_MESSAGE_CHANNEL } from './catch-error-handler.operator';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError, of } from 'rxjs';

describe('catchErrorHandlerOperator', () => {

    let messageChannel: BroadcastChannel;

    beforeEach(() => {
        messageChannel = new BroadcastChannel(ERROR_MESSAGE_CHANNEL);
    });

    afterEach(() => {
        messageChannel.close();
    });

    it('shoud catch error with simple data', () => {
        const errorEmitter = throwError(new HttpErrorResponse({status: 400}));
        const operator = catchErrorHandlerOperator([]);
        operator(errorEmitter).subscribe(data => {
            expect(data).toEqual([]);
        });
    });

    it('shoud catch error with null', () => {
        const errorEmitter = throwError(new HttpErrorResponse({status: 400}));
        const operator = catchErrorHandlerOperator(null!);
        operator(errorEmitter).subscribe(data => {
            expect(data).toEqual(null);
        });
    });

    it('shoud catch error with observable', () => {
        const errorEmitter = throwError(new HttpErrorResponse({status: 400}));
        const operator = catchErrorHandlerOperator(of([]));
        operator(errorEmitter).subscribe(data => {
            expect(data).toEqual([]);
        });
    });

    it('shoud catch error with lambda', () => {
        const errorEmitter = throwError(new HttpErrorResponse({status: 400}));
        const operator = catchErrorHandlerOperator(() => []);
        operator(errorEmitter).subscribe(data => {
            expect(data).toEqual([]);
        });
    });

    it('shoud catch error with lambda observable', () => {
        const errorEmitter = throwError(new HttpErrorResponse({status: 400}));
        const operator = catchErrorHandlerOperator(() => of([]));
        operator(errorEmitter).subscribe(data => {
            expect(data).toEqual([]);
        });
    });

    it('shoud handle error', (done) => {
        messageChannel.onmessage = message => {
            expect(JSON.parse(message.data).status).toBe(400);
            done();
        };
        const errorEmitter = throwError(new HttpErrorResponse({status: 400}));
        const operator = catchErrorHandlerOperator([]);
        operator(errorEmitter).subscribe(response => {
            expect(response).toEqual([]);
        });
    });

    it('should handle as pipe', (done) => {
        messageChannel.onmessage = message => {
            expect(JSON.parse(message.data).status).toBe(400);
            done();
        };
        throwError(new HttpErrorResponse({status: 400})).pipe(
            catchErrorHandlerOperator([])
        ).subscribe(response => {
            expect(response).toEqual([]);
        });
    });

});
