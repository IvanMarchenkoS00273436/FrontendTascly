import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DraftTask, AiGenerateRequest, AiGenerateResponse, BulkCreateRequest } from '../interfaces/tasks/task.interface';
import { ModeService } from './mode.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiTaskGeneratorService {
    private http = inject(HttpClient);
    private modeService = inject(ModeService);
    private apiUrl = environment.apiUrl;

    draftTasks = signal<DraftTask[]>([]);
    isProcessing = signal<boolean>(false);
    errorSignal = signal<string | null>(null);

    async generateTasks(prompt: string, projectId: string): Promise<void> {
        this.isProcessing.set(true);
        this.errorSignal.set(null);

        try {
            const mode = this.modeService.isBusinessMode() ? 'Business' : 'Project';
            const request: AiGenerateRequest = { prompt, projectId, mode };

            const response = await firstValueFrom(
                this.http.post<AiGenerateResponse>(`${this.apiUrl}/Ai/generate-tasks`, request)
            );

            const tasksWithTempIds = response.tasks.map((task, index) => ({
                ...task,
                tempId: Date.now() + index
            }));

            this.draftTasks.set(tasksWithTempIds);
        } catch (error: any) {
            console.error('AI task generation failed:', error);
            this.errorSignal.set(error?.error?.message || 'Failed to generate tasks. Please try again.');
            this.draftTasks.set([]);
        } finally {
            this.isProcessing.set(false);
        }
    }

    async confirmTasks(tasks: DraftTask[], projectId: string): Promise<boolean> {
        try {
            const request: BulkCreateRequest = { tasks, projectId };
            await firstValueFrom(
                this.http.post(`${this.apiUrl}/Ai/bulk-create`, request)
            );
            this.draftTasks.set([]);
            return true;
        } catch (error: any) {
            console.error('Failed to create tasks:', error);
            this.errorSignal.set(error?.error?.message || 'Failed to create tasks. Please try again.');
            return false;
        }
    }

    updateDraftTask(tempId: number, field: keyof DraftTask, value: any): void {
        const updated = this.draftTasks().map(t =>
            t.tempId === tempId ? { ...t, [field]: value } : t
        );
        this.draftTasks.set(updated);
    }

    removeDraftTask(tempId: number): void {
        this.draftTasks.set(this.draftTasks().filter(t => t.tempId !== tempId));
    }

    clearDraftTasks(): void {
        this.draftTasks.set([]);
        this.errorSignal.set(null);
    }

    getDraftTaskCount(): number {
        return this.draftTasks().length;
    }
}