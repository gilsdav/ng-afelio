import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { ToastrModule } from 'ngx-toastr';
import { ErrorHandlerService } from './services/error-handler.service';
import { HttpErrorConfig } from './models/http-error-config';

@NgModule({
    imports: [
        CommonModule,
        ToastrModule
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

    constructor(@Optional() @SkipSelf() parentModule: HttpErrorModule, @Optional() errorHandler: ErrorHandlerService) {
        if (parentModule) {
            throw new Error('HttpErrorModule is already loaded. Import it in your base AppModule only.');
        }
        if (!errorHandler) {
            console.warn('The Global HTTP Error Handler is disabled');
        }
    }
}
