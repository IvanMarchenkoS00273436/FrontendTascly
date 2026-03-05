import { Component, inject, signal, computed } from '@angular/core';
import { AsyncPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksService } from '../../data/services/tasks-service';
import { ProjectsService } from '../../data/services/projects-service';
import { map, switchMap, forkJoin, tap } from 'rxjs';
import { GetTask } from '../../data/interfaces/tasks/get-task';
import { PostTask } from '../../data/interfaces/tasks/post-task';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../auth/auth';

@Component({
    selector: 'app-tasks-kanban-view',
    standalone: true,
    imports: [AsyncPipe, DatePipe, UpperCasePipe, FormsModule],
    templateUrl: './tasks-kanban-view.html',
    styleUrl: './tasks-kanban-view.css',
})
export class TasksKanbanView {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private tasksService = inject(TasksService);
    private projectsService = inject(ProjectsService);
    private authService = inject(Auth);

    get canUseAI() { return this.authService.canUseAI; }
    get currentUserId() { return this.authService.userId; }

    // 'mine' = only tasks assigned to me, 'all' = full board
    viewMode = signal<'all' | 'mine'>('all');

    isCreating = signal(false);
    activeColumnForCreate = signal<string | null>(null);
    columns = signal<string[]>([]);

    // Local mutable state for the board
    groupedTasks = signal<Record<string, GetTask[]>>({});
    statusIdMap = signal<Map<string, any>>(new Map());
    importances = signal<any[]>([]);
    defaultImportanceId = signal<any>(1);

    // Filtered view of tasks based on viewMode
    filteredGroupedTasks = computed(() => {
        const all = this.groupedTasks();
        if (this.viewMode() === 'all') return all;
        const uid = this.currentUserId;
        const result: Record<string, GetTask[]> = {};
        for (const col of Object.keys(all)) {
            result[col] = all[col].filter(t => t.assigneeId === uid);
        }
        return result;
    });

    newTaskName = '';
    newTaskDescription = '';
    newTaskImportanceId: number = 1;
    newTaskStartDate: string = '';
    newTaskDueDate: string = '';
    projectId: string = '';

    // Drag state
    private draggedTask = signal<GetTask | null>(null);
    private draggedFromColumn = signal<string | null>(null);
    dragOverColumn = signal<string | null>(null);

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
                    if (grouped[task.statusName]) grouped[task.statusName].push(task);
                });
            }
            this.groupedTasks.set(grouped);

            const sMap = new Map(statuses.map(s => [s.name, s.id]));
            this.statusIdMap.set(sMap);
            this.importances.set(importances);
            const defImp = importances.length > 0 ? importances[0].id : 1;
            this.defaultImportanceId.set(defImp);

            return { columns: cols, groupedTasks: grouped, statusIdMap: sMap, defaultImportanceId: defImp, importances };
        })
    );

    // ── Create ──────────────────────────────────────────────────────────────

    openCreateForm(columnName: string) {
        this.activeColumnForCreate.set(columnName);
        this.isCreating.set(true);
        this.newTaskName = '';
        this.newTaskDescription = '';
        this.newTaskImportanceId = 1;
        const now = new Date();
        this.newTaskStartDate = now.toISOString().substring(0, 10);
        const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        this.newTaskDueDate = d.toISOString().substring(0, 10);
    }

    openCreateFormFirstColumn(columns: string[]) {
        if (columns.length > 0) this.openCreateForm(columns[0]);
    }

    navigateToAI() {
        this.projectsService.getProjectById(this.projectId).subscribe(project => {
            this.router.navigate(['/dashboard/ai-task-generator'], {
                queryParams: {
                    projectId: this.projectId,
                    workspaceId: project.workspaceId
                }
            });
        });
    }

    navigateToCalendar() {
        this.router.navigate(['/dashboard/projects', this.projectId, 'calendar']);
    }

    cancelCreate() {
        this.isCreating.set(false);
        this.activeColumnForCreate.set(null);
    }

    createTask(statusIdRaw: string | number | undefined, importanceIdRaw: string | number) {
        if (!this.newTaskName.trim() || statusIdRaw === undefined) return;
        const statusId = Number(statusIdRaw);
        const importanceId = Number(this.newTaskImportanceId) || Number(importanceIdRaw);

        const payload: PostTask = {
            name: this.newTaskName,
            description: this.newTaskDescription || '',
            statusId,
            importanceId,
            assigneeId: null,
            startDate: this.newTaskStartDate ? new Date(this.newTaskStartDate) : new Date(),
            dueDate: this.newTaskDueDate ? new Date(this.newTaskDueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };

        this.tasksService.postTaskToProject(this.projectId, payload).subscribe({
            next: () => { this.cancelCreate(); window.location.reload(); },
            error: (err) => console.error(err)
        });
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    deleteTask(task: GetTask) {
        this.tasksService.deleteTask(task.id).subscribe({
            next: () => {
                const grouped = { ...this.groupedTasks() };
                const col = task.statusName;
                if (grouped[col]) {
                    grouped[col] = grouped[col].filter(t => t.id !== task.id);
                    this.groupedTasks.set(grouped);
                }
            },
            error: (err) => console.error('Delete failed:', err)
        });
    }

    // ── Drag and Drop ────────────────────────────────────────────────────────

    onDragStart(task: GetTask, fromColumn: string) {
        this.draggedTask.set(task);
        this.draggedFromColumn.set(fromColumn);
    }

    onDragOver(event: DragEvent, column: string) {
        event.preventDefault();
        this.dragOverColumn.set(column);
    }

    onDragLeave() {
        this.dragOverColumn.set(null);
    }

    onDrop(event: DragEvent, toColumn: string) {
        event.preventDefault();
        this.dragOverColumn.set(null);
        const task = this.draggedTask();
        const fromColumn = this.draggedFromColumn();
        if (!task || fromColumn === toColumn) return;

        const newStatusId = Number(this.statusIdMap().get(toColumn));
        if (!newStatusId) return;

        this.tasksService.updateTaskStatus(task.id, newStatusId).subscribe({
            next: () => {
                const grouped = { ...this.groupedTasks() };
                const from = fromColumn as string;
                grouped[from] = (grouped[from] || []).filter((t: GetTask) => t.id !== task!.id);
                const moved = { ...task, statusName: toColumn };
                grouped[toColumn] = [...(grouped[toColumn] || []), moved];
                this.groupedTasks.set(grouped);
            },
            error: (err) => console.error('Move failed:', err)
        });

        this.draggedTask.set(null);
        this.draggedFromColumn.set(null);
    }

    onDragEnd() {
        this.draggedTask.set(null);
        this.draggedFromColumn.set(null);
        this.dragOverColumn.set(null);
    }

    getGroupedTasks(column: string): GetTask[] {
        return this.filteredGroupedTasks()[column] || [];
    }

    isDragOver(column: string): boolean {
        return this.dragOverColumn() === column;
    }
}
