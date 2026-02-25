import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { GetProject } from '../interfaces/projects/get-project';
import { PostProject } from '../interfaces/projects/post-project';
import { GetStatus } from '../interfaces/projects/get-status';
import { GetTaskImportance } from '../interfaces/projects/get-task-importance';

@Injectable({
    providedIn: 'root',
})

export class ProjectsService {
    http: HttpClient = inject(HttpClient);
    baseUrl: string = environment.apiUrl + '/Projects';

    getWorkspaceProjects(workspaceId: string): Observable<GetProject[]> {
        return this.http.get<GetProject[]>(`${this.baseUrl}/Workspaces/${workspaceId}`);
    }

    postWorkspaceProject(workspaceId: string, postProject: PostProject): Observable<PostProject> {
        return this.http.post<PostProject>(`${this.baseUrl}/Workspaces/${workspaceId}`, postProject, { responseType: 'text' as 'json' });
    }

    getProjectById(projectId: string): Observable<GetProject> { 
        return this.http.get<GetProject>(`${this.baseUrl}/${projectId}`);
    }

    deleteProject(projectId: string): Observable<void> { 
        return this.http.delete<void>(`${this.baseUrl}/${projectId}`);
    }

    getProjectStatuses(projectId: string): Observable<GetStatus[]> { 
        return this.http.get<GetStatus[]>(`${this.baseUrl}/${projectId}/Statuses`);
    }

    getProjectImportances(projectId: string): Observable<GetTaskImportance[]> {
        return this.http.get<GetTaskImportance[]>(`${this.baseUrl}/${projectId}/Importances`);
    }
}
