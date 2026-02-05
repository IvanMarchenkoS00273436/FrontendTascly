import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { catchError, tap, throwError } from 'rxjs';
import { TokenResponse } from './auth-interface';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})

export class Auth {
    http = inject(HttpClient);
    url = environment.apiUrl + '/Auth';
    cookieService = inject(CookieService);
    router = inject(Router);

    access_token: string | null = null;
    refresh_token: string | null = null;

    get isAuth() { 
        if(!this.access_token) {
            this.access_token = this.cookieService.get('access_token');
            this.refresh_token = this.cookieService.get('refresh_token');
        }
        return !!this.access_token;
    }

    get username(): string | null {
        let token = this.access_token;
        if (!token) {
            token = this.cookieService.get('access_token');
        }
        
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.Username;
        } catch (e) {
            return null;
        }
    }

    get userId(): string | null { 
        let token = this.access_token;
        if (!token) {
            token = this.cookieService.get('access_token');
        }

        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.UserId;
        } catch (e) {
            return null;
        }
    }

    login(payload: { email: string; password: string }) {
        return this.http.post<TokenResponse>(
            `${this.url}/login`, 
            payload
        ).pipe(
            tap((res: TokenResponse) => this.saveTokens(res)
        ));
    }

    refreshAuthToken() {
        return this.http.post<TokenResponse>(
            `${this.url}/refresh-token`,
            {
                userId: this.getUserIdFromToken(this.access_token!),
                refreshToken: this.cookieService.get('refresh_token')
            }
        ).pipe(
            tap((res: TokenResponse) => this.saveTokens(res)),
            catchError(err => {
                this.logout();
                return throwError(err);
            })
        )
    }
    
    logout() { 
        this.cookieService.delete('access_token');
        this.cookieService.delete('refresh_token');
        this.access_token = null;
        this.refresh_token = null;
        this.router.navigate(['/login']);
    }

    getUserIdFromToken(token: string): string { 
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.UserId;
    }

    saveTokens(res: TokenResponse) {
        this.access_token = res.accessToken;
        this.refresh_token = res.refreshToken;

        this.cookieService.set('access_token', res.accessToken);
        this.cookieService.set('refresh_token', res.refreshToken);
    }
}
