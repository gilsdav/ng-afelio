import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';<% if(useNgxToastr) { %>
import { ToastrModule } from 'ngx-toastr';<% } %>
import { ErrorHandlerService } from './services/error-handler.service';
import { HttpErrorConfig } from './models/http-error-config';

@NgModule({
    imports: [
        CommonModule,<% if(useNgxToastr) { %>
        ToastrModule<% } %>
    ]
})
export class HttpErrorModule {

    public static forRoot(config: HttpErrorConfig): ModuleWithProviders<HttpErrorModule> {
        return {
            ngModule: HttpErrorModule,
            providers: [
                ...(config.enable ? [
                    ErrorHandlerService,
                    {
                        provide: HttpErrorConfig,
                        useValue: config
                    }
                ] : [])
            ]
        };
    }

    public static forChild(): ModuleWithProviders<HttpErrorModule> {
        return {
            ngModule: HttpErrorModule
        };
    }

    constructor(@Optional() @SkipSelf() parentModule: HttpErrorModule, errorHandler: ErrorHandlerService) {
        if (parentModule) {
            throw new Error('HttpErrorModule is already loaded. Import it in your base AppModule only.');
        }
        if (!errorHandler) {
            throw new Error('Can not handle global errors');
        }
    }
}
