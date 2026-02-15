import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { Getworkcpaces } from '../interfaces/Workspaces/getworkcpaces';
import { GetMemberRoleDto } from '../interfaces/Workspaces/get-member-role-dto';
import { PostWorkspace } from '../interfaces/Workspaces/post-workspace';

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

    getMembersRoles(id: string): Observable<GetMemberRoleDto[]> {
        return this.http.get<GetMemberRoleDto[]>(`${this.baseUrl}/${id}/members`);
    }

    postWorkspace(postWorkspace: PostWorkspace): Observable<PostWorkspace> { 
        return this.http.post<PostWorkspace>(this.baseUrl, postWorkspace, { responseType: 'text' as 'json' });
    }
}
