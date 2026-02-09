import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { Getworkcpaces } from '../interfaces/Workspaces/getworkcpaces';

@Injectable({
    providedIn: 'root',
})

export class WorkspacesService {
    http: HttpClient = inject(HttpClient);
    baseUrl: string = environment.apiUrl + '/workspaces';

    getWorkspaces(): Observable<Getworkcpaces[]> {
        return this.http.get<Getworkcpaces[]>(this.baseUrl);
    }

    getWorkspaceById(id: string): Observable<Getworkcpaces> {
        return this.http.get<Getworkcpaces>(`${this.baseUrl}/${id}`);
    }
}
