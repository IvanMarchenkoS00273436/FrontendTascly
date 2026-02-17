import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { GetTask } from '../interfaces/tasks/get-task';
import { PostTask } from '../interfaces/tasks/post-task';

@Injectable({
    providedIn: 'root',
})

export class TasksService {
    http: HttpClient = inject(HttpClient);
    baseUrl: string = environment.apiUrl + '/tasks';


    getTasksByProjectId(projectId: string) : Observable<GetTask[]> {
        return this.http.get<GetTask[]>(`${this.baseUrl}/Projects/${projectId}`);
    }

    getTaskById(taskId: string) : Observable<GetTask> { 
        return this.http.get<GetTask>(`${this.baseUrl}/${taskId}`);
    }

    postTaskToProject(projectId: string,task: PostTask) : Observable<PostTask> {
        return this.http.post<PostTask>(`${this.baseUrl}/Projects/${projectId}`, task);
    }
}
