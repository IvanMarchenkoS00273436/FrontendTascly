import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { PutUserProfile } from '../interfaces/Users/put-user-profile';
import { Observable } from 'rxjs';
import { GetUserProfile } from '../interfaces/Users/get-user-profile';

@Injectable({
    providedIn: 'root',
})

export class UsersService {
    http: HttpClient = inject(HttpClient);
    apiUrl = environment.apiUrl + '/users';

    getUserProfile(): Observable<GetUserProfile> {
        return this.http.get<GetUserProfile>(this.apiUrl + '/GetUserProfile');
    }

    putUserProfile(putUserProfile: PutUserProfile): Observable<PutUserProfile> {
        return this.http.put<PutUserProfile>(this.apiUrl + '/UpdateUserProfile', putUserProfile);
    }
}
