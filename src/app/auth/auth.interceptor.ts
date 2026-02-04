import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Auth } from "./auth";

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => { 
    const accessToken = inject(Auth).access_token;

    if(!accessToken) return next(req);

    req = req.clone({
        setHeaders: {
            Authorization: `Bearer ${accessToken}`
        }
    })

    return next(req);
}