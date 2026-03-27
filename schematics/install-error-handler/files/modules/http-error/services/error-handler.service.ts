import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
<% if (useNgxToastr) { %>
import { ToastrService } from 'ngx-toastr';<% } %>

import { Debounce } from '../../../decorators/debounce.decorator';
import { HttpErrorConfig } from '../models/http-error-config';
import { ERROR_MESSAGE_CHANNEL } from '../operators/catch-error-handler.operator';

// import { ErrorResponseDto, ErrorTypeDto, BusinessErrorCodeDto } from 'api-project'

// TODO: replace by imports
enum ErrorTypeDto {
    Technical = 'Technical',
    Business = 'Business'
}
enum BusinessErrorCodeDto {
}
interface ErrorResponseDto {
    errorType: ErrorTypeDto;
    businessErrorCode: BusinessErrorCodeDto;
    message: string
}


@Injectable()
export class ErrorHandlerService implements OnDestroy {

    private messageChannel!: BroadcastChannel;
    private destroy$ = new Subject<boolean>();

    constructor(<% if (useNgxToastr) { %>
        private toastr: ToastrService,<% } %>
        private config: HttpErrorConfig,
        protected zone: NgZone,
        private translate: TranslateService
    ) {
        zone.runOutsideAngular(() => {
            this.messageChannel = new BroadcastChannel(ERROR_MESSAGE_CHANNEL);
            this.messageChannel.addEventListener('message', this.messageHandler);
        });
    }

    ngOnDestroy(): void {
        this.messageChannel.removeEventListener('message', this.messageHandler);
        this.destroy$.next(true);
        this.destroy$.complete();
    }

    public init(): void {
        console.debug('Error Handler inited');
    }

    private readonly messageHandler = (message: any) => {
        const error: any = JSON.parse(message.data);
        this.zone.run(() => {
            this.handleError(error);
        });
    }

    /**
     * Managed HttpErrorResponse to decide if we have to show TCH or BSN or do nothing special
     */
    public handleError(error: any): void {
        if (!error || !error.status) { // client-side error
            this.displayConnectionError();
        } else { // server-side error
            if (this.checkCode(error.status)) {
                this.displayServiceError(error);
            }
        }
    }

    /**
     * Returns true if can be handled
     */
    private checkCode(code: number): boolean {
        return !(this.config.codesToExclude || []).includes(code);
    }

    /**
     * Méthode de gestion de tous les cas d'erreurs possibles au niveau des Services
     * Deux types d'erreurs distincts [TECHNICAL] et [BUSINESS]
     * @param error
     */
    private displayServiceError(error: HttpErrorResponse): void {
        if (error.error) {
            const logicError = error.error as ErrorResponseDto;
            if (logicError.errorType === ErrorTypeDto.Technical) {
                this.displayError('HTTP.ERROR.TECHNICAL');
                return;
            } else if (logicError.errorType === ErrorTypeDto.Business) {
                this.displayErrorBusiness(logicError.businessErrorCode!, logicError.message!);
                return;
            }
        }
        this.displayErrorStatus(error.status);
    }

    /**
     * Méthode d'affichage des erreurs techniques
     * @param errorStatus
     */
    private displayErrorStatus(errorStatus: number): void {
        this.displayError(`HTTP.ERROR.STATUS.${errorStatus}`);
    }

    private displayConnectionError(): void {
        this.displayError('HTTP.ERROR.LOCAL_ERROR');
    }

    private displayErrorBusiness(error: BusinessErrorCodeDto, message: string) {
        // Implement logic in use of API
        this.displayError(message);
    }

    @Debounce()
    public displayError(labelKey: string, data?: any): void {
        const title = this.translate.instant('HTTP.ERROR.TITLE');
        this.toastr.error(this.translate.instant(labelKey), title, {
            tapToDismiss: true,
            timeOut: 5000
            // positionClass: 'toast-bottom-left'
        });
    }

    @Debounce()
    public displaySuccess(labelKey: string, data?: any): void {
        const title = this.translate.instant('HTTP.SUCCESS.TITLE');
        this.toastr.success(this.translate.instant(labelKey), title, {
            timeOut: 5000,
            tapToDismiss: true,
            // positionClass: 'toast-bottom-left'
        });
    }

    @Debounce()
    public displayWarning(labelKey: string, data?: any): void {
        const title = this.translate.instant('HTTP.WARNING.TITLE');
        this.toastr.warning(this.translate.instant(labelKey), title, {
            timeOut: 10000,
            tapToDismiss: true,
            positionClass: 'toast-bottom-left'
        });
    }

}
