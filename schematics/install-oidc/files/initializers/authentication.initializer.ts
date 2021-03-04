import { APP_INITIALIZER, Injector, Provider } from '@angular/core';

import { AuthenticationService } from '../services/authentication.service';

// Injector usage because of : https://monolithcode.co.uk/angular-app_initializer-and-multiple-instances-of-a-service
export const AuthenticationInitializerFactory = (injector: Injector) => () => {
    const initialAuthService: AuthenticationService = injector.get<AuthenticationService>(AuthenticationService);
    return initialAuthService.initAuthentication();
};

export const authenticationInitializerProvider: Provider = {
    provide: APP_INITIALIZER,
    useFactory: AuthenticationInitializerFactory,
    deps: [Injector],
    multi: true
};
