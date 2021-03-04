import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { OAuthService, OAuthStorage } from 'angular-oauth2-oidc';

import { AuthenticationService } from './services/authentication.service';
import { authenticationInterceptorProvider } from './interceptors/authentication.interceptor';
import { authenticationInitializerProvider } from './initializers/authentication.initializer';
import { PermissionGuard } from './guards/permission-guard';
import { CanAccessDirective } from './directives/canAccess.directive';

export function storageFactory(): OAuthStorage {
    return sessionStorage; // Can be replaced by localStorage
}

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        CanAccessDirective
    ],
    exports: [
        CanAccessDirective
    ]
})
export class AuthenticationModule {

    public static forRoot(): ModuleWithProviders<AuthenticationModule> {
        return {
            ngModule: AuthenticationModule,
            providers: [
                AuthenticationService,
                authenticationInterceptorProvider,
                authenticationInitializerProvider,
                PermissionGuard,
                { provide: OAuthStorage, useFactory: storageFactory }
            ]
        };
    }

    public static forChild(): ModuleWithProviders<AuthenticationModule> {
        return {
            ngModule: AuthenticationModule
        };
    }

    constructor(
        // @Optional() @SkipSelf() parentModule: AuthenticationModule,
        @Optional() http: HttpClient,
        @Optional() oauthService: OAuthService
    ) {
        // if (parentModule) {
        //     throw new Error('AuthenticationModule is already loaded. Import in your base AppModule only.');
        // }
        if (!http) {
            throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
            'See also https://github.com/angular/angular/issues/20575');
        }
        if (!oauthService) {
            throw new Error('You need to import the OAuthModule.forRoot() in your AppModule! \n' +
            'See also https://github.com/manfredsteyer/angular-oauth2-oidc#importing-the-ngmodule');
        }
    }
}
