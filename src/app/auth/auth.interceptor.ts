import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { Auth } from "./auth";
import { catchError, switchMap, throwError } from "rxjs";
import { TokenResponse } from "./auth-interface";

let isRefreshing = false;

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => { 
    const authService = inject(Auth);
    const accessToken = authService.access_token;

    if(!accessToken) return next(req);

    if(isRefreshing) { 
        return refreshAndProceed(authService, req, next);
    }

    return next(addToken(req, accessToken))
    .pipe(
        catchError(error => {
            // if refresh token is expired
            if(error.status === 403) {
                return refreshAndProceed(authService, req, next);
            }
            return throwError(() => error);
        })
    )
}

const refreshAndProceed = (authService: Auth, req: HttpRequest<any>, next: HttpHandlerFn) => {
    if(!isRefreshing) { 
        isRefreshing = true;

        return authService.refreshAuthToken()
        .pipe(
            switchMap((res: TokenResponse) => {
                isRefreshing = false;
                return next(addToken(req, res.accessToken));
            })
        )
    }
    
    return next(addToken(req, authService.access_token!));
}

const addToken = (req: HttpRequest<any>, accessToken: string) => {
    return req.clone({
        setHeaders: {
            Authorization: `Bearer ${accessToken}`
        }
    })
}