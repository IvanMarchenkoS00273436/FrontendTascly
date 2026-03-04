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


    getTasksByProjectId(projectId: string): Observable<GetTask[]> {
        return this.http.get<GetTask[]>(`${this.baseUrl}/Projects/${projectId}`);
    }

    getTaskById(taskId: string): Observable<GetTask> {
        return this.http.get<GetTask>(`${this.baseUrl}/${taskId}`);
    }

    postTaskToProject(projectId: string, task: PostTask): Observable<any> {
        return this.http.post(`${this.baseUrl}/Projects/${projectId}`, task, { responseType: 'text' });
    }

    deleteTask(taskId: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/${taskId}`, { responseType: 'text' });
    }

    updateTaskStatus(taskId: string, newStatusId: number): Observable<any> {
        const patch = [{ op: 'replace', path: '/statusId', value: newStatusId }];
        return this.http.patch(`${this.baseUrl}/${taskId}`, patch, { responseType: 'text' });
    }
}
