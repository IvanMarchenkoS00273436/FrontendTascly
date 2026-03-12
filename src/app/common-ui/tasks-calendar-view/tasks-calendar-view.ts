import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksService } from '../../data/services/tasks-service';
import { ProjectsService } from '../../data/services/projects-service';
import { switchMap, forkJoin, map, tap, of, BehaviorSubject, combineLatest } from 'rxjs';
import { GetTask } from '../../data/interfaces/tasks/get-task';
import { AsyncPipe } from '@angular/common';
import { Auth } from '../../auth/auth';
import { FormsModule } from '@angular/forms';
import { WorkspacesService } from '../../data/services/workspaces-service';
import { GetMemberRoleDto } from '../../data/interfaces/Workspaces/get-member-role-dto';
import { PostTask } from '../../data/interfaces/tasks/post-task';

export type RangeType = 'single' | 'start' | 'middle' | 'end';

export interface TaskOnDay {
    task: GetTask;
    rangeType: RangeType;
    lane: number;
}

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    tasks: TaskOnDay[];
}

function sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function daysBetween(start: Date, end: Date): number {
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return Math.round((e.getTime() - s.getTime()) / 86400000);
}

@Component({
    selector: 'app-tasks-calendar-view',
    standalone: true,
    imports: [CommonModule, AsyncPipe, FormsModule],
    templateUrl: './tasks-calendar-view.html',
    styleUrl: './tasks-calendar-view.css',
})
export class TasksCalendarView {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private tasksService = inject(TasksService);
    private projectsService = inject(ProjectsService);
    private workspacesService = inject(WorkspacesService);
    private authService = inject(Auth);

    get canUseAI() { return this.authService.canUseAI; }
    get currentUserId() { return this.authService.userId; }

    isCreating = signal(false);
    newTaskName = '';
    newTaskDescription = '';
    newTaskImportanceId: number | string = 1;
    newTaskAssigneeId: string = '';
    newTaskStartDate: string = '';
    newTaskDueDate: string = '';

    statusIdMap = signal<Map<string, any>>(new Map());
    importances = signal<any[]>([]);
    workspaceMembers = signal<GetMemberRoleDto[]>([]);
    defaultStatusId = signal<any>(null);
    defaultImportanceId = signal<any>(1);

    viewMode = signal<'all' | 'mine'>('all');

    projectId: string = '';
    today = new Date();
    currentMonth = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
    allTasks = signal<GetTask[]>([]);

    monthLabel = computed(() =>
        this.currentMonth().toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })
    );

    refresh$ = new BehaviorSubject<void>(undefined);

    calendarDays = computed<CalendarDay[]>(() => {
        let tasks = this.allTasks();
        if (this.viewMode() === 'mine') {
            const uid = this.currentUserId;
            tasks = tasks.filter(t => t.assigneeId === uid);
        }

        const month = this.currentMonth();
        const year = month.getFullYear();
        const mon = month.getMonth();

        const firstDay = new Date(year, mon, 1);
        const lastDay = new Date(year, mon + 1, 0);
        const startOffset = (firstDay.getDay() + 6) % 7;

        // Build cell dates
        const cellDates: Date[] = [];
        for (let i = startOffset - 1; i >= 0; i--)
            cellDates.push(new Date(year, mon, -i));
        for (let d = 1; d <= lastDay.getDate(); d++)
            cellDates.push(new Date(year, mon, d));
        while (cellDates.length % 7 !== 0)
            cellDates.push(new Date(year, mon + 1, cellDates.length - lastDay.getDate() - startOffset + 1));

        // Lane assignment: track which lanes are free up to which date per week row
        // For each task, assign a lane per week row it appears in
        // Simple greedy: one lane map per week row (7-cell group)
        const weekCount = cellDates.length / 7;
        // lane[week][lane] = lastDateIndex occupied
        const laneFree: number[][] = Array.from({ length: weekCount }, () => []);

        // For each task compute which cells it covers
        const taskLanes = new Map<string, number[]>(); // taskId -> lane per week

        const sortedTasks = [...tasks].sort((a, b) =>
            new Date(a.startDate ?? a.dueDate).getTime() - new Date(b.startDate ?? b.dueDate).getTime()
        );

        for (const task of sortedTasks) {
            const start = new Date(task.startDate ?? task.dueDate);
            const end = new Date(task.dueDate);
            const lanes: number[] = [];

            for (let w = 0; w < weekCount; w++) {
                const weekStart = cellDates[w * 7];
                const weekEnd = cellDates[w * 7 + 6];

                // Does this task overlap this week?
                if (end < weekStart || start > weekEnd) {
                    lanes.push(-1); // not in this week
                    continue;
                }

                // Find first free lane for this week
                let lane = 0;
                while (laneFree[w][lane] !== undefined && laneFree[w][lane] > 0) lane++;
                // Mark cells occupied
                const taskEndInWeek = end > weekEnd ? weekEnd : end;
                const dayOffset = Math.max(0, daysBetween(weekStart, taskEndInWeek));
                laneFree[w][lane] = dayOffset;
                lanes.push(lane);
            }
            taskLanes.set(task.id, lanes);
        }

        // Build CalendarDay array
        return cellDates.map((date, idx) => {
            const w = Math.floor(idx / 7);
            const isCurrentMonth = date.getMonth() === mon;

            const dayTasks: TaskOnDay[] = [];
            for (const task of sortedTasks) {
                const start = new Date(task.startDate ?? task.dueDate);
                const end = new Date(task.dueDate);
                // Normalize to midnight
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                const d = new Date(date); d.setHours(0, 0, 0, 0);

                if (d < start || d > end) continue;

                const isStart = sameDay(d, start);
                const isEnd = sameDay(d, end);
                let rangeType: RangeType;
                if (isStart && isEnd) rangeType = 'single';
                else if (isStart) rangeType = 'start';
                else if (isEnd) rangeType = 'end';
                else rangeType = 'middle';

                // Reset lane at week boundaries
                const weekStart = cellDates[w * 7];
                if (!isStart && sameDay(d, weekStart)) {
                    // Task continues from previous week — show as if it starts here within the row
                    // but visually it should look like continuation
                }

                const lanes = taskLanes.get(task.id)!;
                const lane = lanes[w] ?? 0;
                dayTasks.push({ task, rangeType, lane });
            }

            // Sort by lane so pills stack in the right row
            dayTasks.sort((a, b) => a.lane - b.lane);
            return { date, isCurrentMonth, tasks: dayTasks };
        });
    });

    viewData$ = combineLatest([this.route.paramMap, this.refresh$]).pipe(
        tap(([params]) => this.projectId = params.get('id')!),
        switchMap(([params]) => {
            const projectId = params.get('id')!;
            return this.projectsService.getProjectById(projectId).pipe(
                switchMap(project => {
                    return forkJoin({
                        project: of(project),
                        members: this.workspacesService.getMembersRoles(project.workspaceId),
                        tasks: this.tasksService.getTasksByProjectId(projectId),
                        statuses: this.projectsService.getProjectStatuses(projectId),
                        importances: this.projectsService.getProjectImportances(projectId)
                    });
                })
            );
        }),
        map(({ project, members, tasks, statuses, importances }) => {
            this.workspaceMembers.set(members);
            this.allTasks.set(Array.isArray(tasks) ? tasks : []);
            
            const sMap = new Map(statuses.map((s: any) => [s.name, s.id]));
            this.statusIdMap.set(sMap);
            if (statuses.length > 0) {
                this.defaultStatusId.set(statuses[0].id);
            }
            this.importances.set(importances);
            const defImp = importances.length > 0 ? importances[0].id : 1;
            this.defaultImportanceId.set(defImp);

            return project;
        })
    );
    prevMonth() {
        const m = this.currentMonth();
        this.currentMonth.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
    }
    nextMonth() {
        const m = this.currentMonth();
        this.currentMonth.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
    }
    goToToday() {
        this.currentMonth.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
    }
    isToday(date: Date): boolean {
        return sameDay(date, this.today);
    }
    switchToBoard() {
        this.router.navigate(['/dashboard/projects', this.projectId]);
    }
    navigateToTable() {
        this.router.navigate(['/dashboard/projects', this.projectId, 'table']);
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
    
    getImportanceClass(task: GetTask): string {
        const name = task.importanceName?.toLowerCase() ?? '';
        if (name.includes('high') || name.includes('critical')) return 'imp-high';
        if (name.includes('medium') || name.includes('normal')) return 'imp-medium';
        return 'imp-low';
    }

    openCreateForm() {
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

    cancelCreate() {
        this.isCreating.set(false);
    }

    createTask() {
        if (!this.newTaskName.trim() || this.defaultStatusId() === null) return;
        const statusId = Number(this.defaultStatusId());
        const importanceId = Number(this.newTaskImportanceId) || Number(this.defaultImportanceId());

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
}
