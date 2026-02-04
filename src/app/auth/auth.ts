import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { tap } from 'rxjs';
import { TokenResponse } from './auth-interface';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
    providedIn: 'root',
})

export class Auth {
    http = inject(HttpClient);
    url = environment.apiUrl + '/Auth';
    cookieService = inject(CookieService);

    access_token: string | null = null;
    refresh_token: string | null = null;

    get isAuth() { 
        if(!this.access_token) {
            this.access_token = this.cookieService.get('access_token');
            this.refresh_token = this.cookieService.get('refresh_token');
        }
        return !!this.access_token;
    }

    login(payload: { email: string; password: string }) {
        return this.http.post<TokenResponse>(
            `${this.url}/login`, 
            payload
        ).pipe(
            tap((res: TokenResponse) => { 
                this.access_token = res.accessToken;
                this.refresh_token = res.refreshToken;

                this.cookieService.set('access_token', res.accessToken);
                this.cookieService.set('refresh_token', res.refreshToken);
            }
        ));
    }
}
