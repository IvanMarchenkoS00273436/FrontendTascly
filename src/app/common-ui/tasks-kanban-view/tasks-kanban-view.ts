import { Component, inject, signal, computed } from '@angular/core';
import { AsyncPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksService } from '../../data/services/tasks-service';
import { ProjectsService } from '../../data/services/projects-service';
import { WorkspacesService } from '../../data/services/workspaces-service';
import { map, switchMap, forkJoin, tap, of, BehaviorSubject, combineLatest, catchError } from 'rxjs';
import { GetTask } from '../../data/interfaces/tasks/get-task';
import { PostTask } from '../../data/interfaces/tasks/post-task';
import { GetMemberRoleDto } from '../../data/interfaces/Workspaces/get-member-role-dto';
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
    private workspacesService = inject(WorkspacesService);
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
    workspaceMembers = signal<GetMemberRoleDto[]>([]);
    memberLookup = computed(() => {
        const map = new Map<string, GetMemberRoleDto>();
        for (const m of this.workspaceMembers()) {
            map.set(m.memberId, m);
        }
        return map;
    });
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
    newTaskAssigneeId: string = '';
    newTaskStartDate: string = '';
    newTaskDueDate: string = '';
    projectId: string = '';

    // Edit state
    isEditing = signal(false);
    editingTask = signal<GetTask | null>(null);
    editTaskName = '';
    editTaskDescription = '';
    editTaskImportanceId: number = 1;
    editTaskAssigneeId: string = '';
    editTaskStartDate: string = '';
    editTaskDueDate: string = '';
    editTaskStatusId: number | null = null;

    // Drag state
    private draggedTask = signal<GetTask | null>(null);
    private draggedFromColumn = signal<string | null>(null);
    dragOverColumn = signal<string | null>(null);

    currentUserRole = signal<string | null>(null);

    refresh$ = new BehaviorSubject<void>(undefined);

    viewData$ = combineLatest([this.route.paramMap, this.refresh$]).pipe(
        tap(([params]) => this.projectId = params.get('id')!),
        switchMap(([params]) => {
            const projectId = params.get('id')!;
            return this.projectsService.getProjectById(projectId).pipe(
                switchMap(project => {
                    return forkJoin({
                        project: of(project),
                        members: this.workspacesService.getMembersRoles(project.workspaceId),
                        role: this.workspacesService.getWorkspaceMemberRole(project.workspaceId).pipe(
                            catchError(() => of({ name: 'None' }))
                        ),
                        tasks: this.tasksService.getTasksByProjectId(projectId),
                        statuses: this.projectsService.getProjectStatuses(projectId),
                        importances: this.projectsService.getProjectImportances(projectId)
                    });
                })
            );
        }),
        map(({ project, members, role, tasks, statuses, importances }) => {
            this.currentUserRole.set(role.name);
            const cols = statuses.map(s => s.name);
            this.columns.set(cols);

            this.workspaceMembers.set(members);

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
        this.newTaskAssigneeId = '';
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

    navigateToTable() {
        this.router.navigate(['/dashboard/projects', this.projectId, 'table']);
    }

    cancelCreate() {
        this.isCreating.set(false);
        this.activeColumnForCreate.set(null);
    }

    openEditForm(task: GetTask) {
        this.editingTask.set(task);
        this.editTaskName = task.name;
        this.editTaskDescription = task.description || '';
        this.editTaskImportanceId = Array.isArray(this.importances()) && this.importances().find(i => i.name === task.importanceName)?.id || 1;
        
        // Handle unassigned tasks clearly (null, empty, or default GUID strings)
        const isEmptyGuid = task.assigneeId === '00000000-0000-0000-0000-000000000000';
        this.editTaskAssigneeId = (!task.assigneeId || isEmptyGuid) ? '' : task.assigneeId;
        
        this.editTaskStartDate = task.startDate ? new Date(task.startDate.toString()).toISOString().substring(0, 10) : '';
        this.editTaskDueDate = task.dueDate ? new Date(task.dueDate.toString()).toISOString().substring(0, 10) : '';
        this.editTaskStatusId = this.statusIdMap().get(task.statusName) || null;
        this.isEditing.set(true);
    }

    cancelEdit() {
        this.isEditing.set(false);
        this.editingTask.set(null);
    }

    saveTaskEdit() {
        const task = this.editingTask();
        if (!task || !this.editTaskName.trim()) return;
        
        const patch = [
            { op: 'replace', path: '/name', value: this.editTaskName },
            { op: 'replace', path: '/description', value: this.editTaskDescription },
            { op: 'replace', path: '/importanceId', value: Number(this.editTaskImportanceId) },
            { op: 'replace', path: '/assigneeId', value: this.editTaskAssigneeId ? this.editTaskAssigneeId : null },
            { op: 'replace', path: '/startDate', value: this.editTaskStartDate ? new Date(this.editTaskStartDate).toISOString() : null },
            { op: 'replace', path: '/dueDate', value: this.editTaskDueDate ? new Date(this.editTaskDueDate).toISOString() : null }
        ];

        this.tasksService.updateTask(task.id, patch).subscribe({
            next: () => {
                const grouped = { ...this.groupedTasks() };
                const colTasks = grouped[task.statusName];
                if (colTasks) {
                    const index = colTasks.findIndex(t => t.id === task.id);
                    if (index !== -1) {
                        const newImp = this.importances().find(i => i.id === Number(this.editTaskImportanceId));
                        colTasks[index] = {
                            ...colTasks[index],
                            name: this.editTaskName,
                            description: this.editTaskDescription,
                            assigneeId: this.editTaskAssigneeId ? this.editTaskAssigneeId : colTasks[index].assigneeId,
                            startDate: this.editTaskStartDate ? new Date(this.editTaskStartDate) : colTasks[index].startDate,
                            dueDate: this.editTaskDueDate ? new Date(this.editTaskDueDate) : colTasks[index].dueDate,
                            importanceName: newImp ? newImp.name : colTasks[index].importanceName
                        };
                        this.groupedTasks.set(grouped);
                    }
                }
                this.cancelEdit();
            },
            error: err => {
                console.error('Failed to update task', err);
            }
        });
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
            assigneeId: this.newTaskAssigneeId ? this.newTaskAssigneeId : null,
            startDate: this.newTaskStartDate ? new Date(this.newTaskStartDate) : new Date(),
            dueDate: this.newTaskDueDate ? new Date(this.newTaskDueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };

        this.tasksService.postTaskToProject(this.projectId, payload).subscribe({
            next: () => { 
                this.cancelCreate(); 
                this.refresh$.next(); 
            },
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

    getAssigneeInitials(task: GetTask): string {
        const assigneeId = task.assigneeId;
        if (!assigneeId || assigneeId === '00000000-0000-0000-0000-000000000000') {
            return 'UN';
        }

        const member = this.memberLookup().get(assigneeId);
        if (!member) return 'UN';

        const first = (member.firstName || '').trim();
        const last = (member.lastName || '').trim();

        if (first && last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
        if (first) return first.slice(0, 2).toUpperCase();
        if (last) return last.slice(0, 2).toUpperCase();
        return 'UN';
    }

    getAssigneeDisplayName(task: GetTask): string {
        const assigneeId = task.assigneeId;
        if (!assigneeId || assigneeId === '00000000-0000-0000-0000-000000000000') {
            return 'Unassigned';
        }

        const member = this.memberLookup().get(assigneeId);
        if (!member) return 'Unassigned';

        return `${member.firstName} ${member.lastName}`.trim();
    }

    // --- Mouse Drag & Wheel SCROLL logic ---
    isDraggingScroll = false;
    startX = 0;
    scrollLeft = 0;

    onScrollMouseDown(e: MouseEvent, boardElement: HTMLElement): void {
        // Prevent drag-scroll if interacting with a task or button
        if ((e.target as HTMLElement).closest('.task-card, button, .bento-split-btn')) {
            return;
        }
        
        this.isDraggingScroll = true;
        boardElement.style.cursor = 'grabbing';
        this.startX = e.pageX - boardElement.offsetLeft;
        this.scrollLeft = boardElement.scrollLeft;
    }

    onScrollMouseLeave(boardElement: HTMLElement): void {
        if (!this.isDraggingScroll) return;
        this.isDraggingScroll = false;
        boardElement.style.cursor = '';
    }

    onScrollMouseUp(boardElement: HTMLElement): void {
        if (!this.isDraggingScroll) return;
        this.isDraggingScroll = false;
        boardElement.style.cursor = '';
    }

    onScrollMouseMove(e: MouseEvent, boardElement: HTMLElement): void {
        if (!this.isDraggingScroll) return;
        e.preventDefault();
        const x = e.pageX - boardElement.offsetLeft;
        const walk = (x - this.startX) * 1.5; // Scroll speed multiplier
        boardElement.scrollLeft = this.scrollLeft - walk;
    }

    onScrollWheel(e: WheelEvent, boardElement: HTMLElement): void {
        const target = e.target as HTMLElement;
        const scrollableCustomContainer = target.closest('.tasks-container');
        
        // If we are over a column's task list and it has vertical scroll, let it scroll normally
        if (scrollableCustomContainer) {
            const hasVerticalScroll = scrollableCustomContainer.scrollHeight > scrollableCustomContainer.clientHeight;
            if (hasVerticalScroll) return; // do not hijack wheel if we can scroll vertically
        }

        const isScrollableX = boardElement.scrollWidth > boardElement.clientWidth;
        if (isScrollableX && e.deltaY !== 0 && !e.shiftKey) {
            boardElement.scrollLeft += e.deltaY;
            // Prevent vertical scroll only if we use this for horizontal scroll
            e.preventDefault();
        }
    }
}
