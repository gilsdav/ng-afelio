import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders, ModuleWithProviders, NgModule, Optional, Provider, SkipSelf } from '@angular/core';

import { BlobErrorInterceptor } from './interceptors/blob-error/blob-error.interceptor';
import { HttpErrorConfig } from './models/http-error-config';
import { ErrorHandlerService } from './services/error-handler.service';

@NgModule({})
export class HttpErrorModule {

    public static forRoot(config: HttpErrorConfig): ModuleWithProviders<HttpErrorModule> {
        return {
            ngModule: HttpErrorModule,
            providers: [
                ErrorHandlerService,
                {
                    provide: HttpErrorConfig,
                    useValue: config
                },
                { provide: HTTP_INTERCEPTORS, useClass: BlobErrorInterceptor, multi: true }
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

export const provideHttpErrorHandler = (config: HttpErrorConfig = {}): EnvironmentProviders => {
    const providers: Provider[] = [
            ErrorHandlerService,
            {
                provide: HttpErrorConfig,
                useValue: config
            },
            { provide: HTTP_INTERCEPTORS, useClass: BlobErrorInterceptor, multi: true }
    ];

    return makeEnvironmentProviders(providers);
}
