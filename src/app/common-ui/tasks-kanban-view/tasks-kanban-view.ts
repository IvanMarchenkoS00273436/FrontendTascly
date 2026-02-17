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

    newTaskName = '';
    newTaskDescription = '';
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
            const columns = statuses.map(s => s.name);
            const grouped: Record<string, GetTask[]> = {};
            columns.forEach(col => grouped[col] = []);

            if (Array.isArray(tasks)) {
                tasks.forEach(task => {
                    const status = task.statusName;
                    if (grouped[status]) {
                        grouped[status].push(task);
                    }
                });
            }

            // Map Status Name -> Status ID (number)
            const statusIdMap = new Map(statuses.map(s => [s.name, s.id]));

            // Default Importance ID (number)
            const defaultImportanceId = importances.length > 0 ? importances[0].id : 1;

            return { columns, groupedTasks: grouped, statusIdMap, defaultImportanceId };
        })
    );

    openCreateForm(columnName: string) {
        this.activeColumnForCreate.set(columnName);
        this.isCreating.set(true);
        this.newTaskName = '';
    }

    cancelCreate() {
        this.isCreating.set(false);
        this.activeColumnForCreate.set(null);
    }

    createTask(statusIdRaw: string | number | undefined, importanceIdRaw: string | number) {
        if (!this.newTaskName.trim() || statusIdRaw === undefined) return;

        // Ensure IDs are numbers
        const statusId = Number(statusIdRaw);
        const importanceId = Number(importanceIdRaw);

        const payload: PostTask = {
            name: this.newTaskName,
            description: this.newTaskDescription,
            statusId: statusId,
            importanceId: importanceId,
            assigneeId: null,
            startDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week later

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
