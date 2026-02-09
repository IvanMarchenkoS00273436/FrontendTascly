import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';

export const canActivateAuth: CanActivateFn = (route, state) => {
    const isLoggedIn = inject(Auth).isAuth;

    if(isLoggedIn) {
        return true;
    }

    return inject(Router).createUrlTree(['/login']);
};
