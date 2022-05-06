import { Injectable, NgZone, OnDestroy } from '@angular/core';<% if(useNgxToastr) { %>
import { ToastrService } from 'ngx-toastr';<% } %>
import { Subject } from 'rxjs';
import { Debounce } from '../../../decorators/debounce.decorator';
import { HttpErrorConfig } from '../models/http-error-config';
import { ERROR_MESSAGE_CHANNEL } from '../operators/catch-error-handler.operator';

@Injectable()
export class ErrorHandlerService implements OnDestroy {

    private messageChannel!: BroadcastChannel;
    private destroy$ = new Subject<boolean>();

    constructor(<% if (useNgxToastr) { %>
        private toastr: ToastrService,<% } %>
        private config: HttpErrorConfig,
        protected zone: NgZone
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

    private messageHandler = (message: any) => {
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
    private displayServiceError(error: any): void {
        // TODO: Improve error managing by adding logic for business error
        this.displayErrorStatus(error);
    }

    /**
     * Méthode d'affichage des erreurs techniques
     * @param error
     */
    private displayErrorStatus(error: any): void {
        let code = error.status;
        // TODO: Improve message to display with a translated string
        this.displayError(code);
    }

    private displayConnectionError(): void {
        // TODO: Improve message to display with a translated string
        this.displayError('HTTP_ERROR.LOCAL_ERROR');
    }

    @Debounce()
    public displayError(labelKey: string, data?: any): void {
        // TODO: Improve message to display with a translated string
        const title = 'Error';<% if (useNgxToastr) { %>
        this.toastr.error(labelKey, title, {
            tapToDismiss: true,
            timeOut: 15000
        });<% } else { %>
        console.log(`ErrorHandlerService - ${title} : ${labelKey}`);<% } %>
    }

    @Debounce()
    public displaySuccess(labelKey: string, data?: any): void {
        // TODO: Improve message to display with a translated string
        const title = 'Success';<% if (useNgxToastr) { %>
        this.toastr.success(labelKey, title, {
            timeOut: 5000,
            tapToDismiss: true
        });<% } else { %>
        console.log(`ErrorHandlerService - ${title} : ${labelKey}`);<% } %>
    }

}
