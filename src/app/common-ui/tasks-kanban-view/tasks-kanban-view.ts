import { Component, inject, signal } from '@angular/core';
import { AsyncPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TasksService } from '../../data/services/tasks-service';
import { ProjectsService } from '../../data/services/projects-service';
import { map, switchMap, forkJoin, tap } from 'rxjs';
import { GetTask } from '../../data/interfaces/tasks/get-task';
import { PostTask } from '../../data/interfaces/tasks/post-task';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-tasks-kanban-view',
    standalone: true,
    imports: [AsyncPipe, DatePipe, UpperCasePipe, FormsModule],
    templateUrl: './tasks-kanban-view.html',
    styleUrl: './tasks-kanban-view.css',
})
export class TasksKanbanView {
    private route = inject(ActivatedRoute);
    private tasksService = inject(TasksService);
    private projectsService = inject(ProjectsService);

    isCreating = signal(false);
    activeColumnForCreate = signal<string | null>(null);
    columns = signal<string[]>([]);

    newTaskName = '';
    newTaskDescription = '';
    newTaskImportanceId: number = 1;
    newTaskDueDate: string = '';
    projectId: string = '';

    viewData$ = this.route.paramMap.pipe(
        tap(params => this.projectId = params.get('id')!),
        switchMap(params => {
            const projectId = params.get('id')!;
            return forkJoin({
                tasks: this.tasksService.getTasksByProjectId(projectId),
                statuses: this.projectsService.getProjectStatuses(projectId),
                importances: this.projectsService.getProjectImportances(projectId)
            });
        }),
        map(({ tasks, statuses, importances }) => {
            const cols = statuses.map(s => s.name);
            this.columns.set(cols);
            const grouped: Record<string, GetTask[]> = {};
            cols.forEach(col => grouped[col] = []);

            if (Array.isArray(tasks)) {
                tasks.forEach(task => {
                    const status = task.statusName;
                    if (grouped[status]) {
                        grouped[status].push(task);
                    }
                });
            }

            const statusIdMap = new Map(statuses.map(s => [s.name, s.id]));
            const defaultImportanceId = importances.length > 0 ? importances[0].id : 1;
            return { columns: cols, groupedTasks: grouped, statusIdMap, defaultImportanceId, importances };
        })
    );

    openCreateForm(columnName: string) {
        this.activeColumnForCreate.set(columnName);
        this.isCreating.set(true);
        this.newTaskName = '';
        this.newTaskDescription = '';
        this.newTaskImportanceId = 1;
        // Default due date to 1 week from now
        const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        this.newTaskDueDate = d.toISOString().substring(0, 10);
    }

    openCreateFormFirstColumn(columns: string[]) {
        if (columns.length > 0) this.openCreateForm(columns[0]);
    }

    cancelCreate() {
        this.isCreating.set(false);
        this.activeColumnForCreate.set(null);
    }

    createTask(statusIdRaw: string | number | undefined, importanceIdRaw: string | number) {
        if (!this.newTaskName.trim() || statusIdRaw === undefined) return;

        // Ensure IDs are numbers (HTML selects always return strings from ngModel)
        const statusId = Number(statusIdRaw);
        const importanceId = Number(this.newTaskImportanceId) || Number(importanceIdRaw);

        const payload: PostTask = {
            name: this.newTaskName,
            description: this.newTaskDescription || '',
            statusId: statusId,
            importanceId: importanceId,
            assigneeId: null,
            startDate: new Date(),
            dueDate: this.newTaskDueDate ? new Date(this.newTaskDueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };

        this.tasksService.postTaskToProject(this.projectId, payload).subscribe({
            next: () => {
                this.cancelCreate();
                window.location.reload();
            },
            error: (err) => console.error(err)
        });
    }
}
