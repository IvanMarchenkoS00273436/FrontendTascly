import { Component, inject, signal } from '@angular/core';
import { AsyncPipe, DatePipe, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksService } from '../../data/services/tasks-service';
import { ProjectsService } from '../../data/services/projects-service';
import { switchMap, tap, map, forkJoin, of, BehaviorSubject } from 'rxjs';
import { Auth } from '../../auth/auth';
import { combineLatest } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { WorkspacesService } from '../../data/services/workspaces-service';
import { GetMemberRoleDto } from '../../data/interfaces/Workspaces/get-member-role-dto';
import { PostTask } from '../../data/interfaces/tasks/post-task';

@Component({
  selector: 'app-tasks-table-view',
  standalone: true,
  imports: [AsyncPipe, DatePipe, CommonModule, FormsModule],
  templateUrl: './tasks-table-view.html',
  styleUrl: './tasks-table-view.css'
})
export class TasksTableView {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tasksService = inject(TasksService);
  private projectsService = inject(ProjectsService);
  private workspacesService = inject(WorkspacesService);
  private authService = inject(Auth);

  get canUseAI() { return this.authService.canUseAI; }
  get currentUserId() { return this.authService.userId; }

  viewMode = signal<'all' | 'mine'>('all');

  projectId = '';

  refresh$ = new BehaviorSubject<void>(undefined);

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
  currentUserRole = signal<string | null>(null);

  viewData$ = this.route.paramMap.pipe(
    switchMap(params => {
        const projectId = params.get('id')!;
        return this.projectsService.getProjectById(projectId).pipe(
            switchMap(project => {
                return forkJoin({
                    project: of(project),
                    members: this.workspacesService.getMembersRoles(project.workspaceId),
                    role: this.workspacesService.getWorkspaceMemberRole(project.workspaceId),
                    statuses: this.projectsService.getProjectStatuses(projectId),
                    importances: this.projectsService.getProjectImportances(projectId)
                });
            })
        );
    }),
    tap(({ project, members, role, statuses, importances }) => {
        this.currentUserRole.set(role.name);
        this.workspaceMembers.set(members);
        const sMap = new Map(statuses.map((s: any) => [s.name, s.id]));
        this.statusIdMap.set(sMap);
        if (statuses.length > 0) {
            this.defaultStatusId.set(statuses[0].id);
        }
        this.importances.set(importances);
        const defImp = importances.length > 0 ? importances[0].id : 1;
        this.defaultImportanceId.set(defImp);
    })
  );

  tasks$ = combineLatest([
    combineLatest([this.route.paramMap, this.refresh$]).pipe(
      tap(([params]) => this.projectId = params.get('id')!),
      switchMap(() => this.tasksService.getTasksByProjectId(this.projectId))
    ),
    toObservable(this.viewMode)
  ]).pipe(
    map(([tasks, viewMode]) => {
      if (viewMode === 'mine') {
        const uid = this.currentUserId;
        return tasks.filter(t => t.assigneeId === uid);
      }
      return tasks;
    })
  );

  navigateToBoard() {
    this.router.navigate(['/dashboard/projects', this.projectId]);
  }

  navigateToCalendar() {
    this.router.navigate(['/dashboard/projects', this.projectId, 'calendar']);
  }
  
  navigateToBoardToCreate() {
    this.router.navigate(['/dashboard/projects', this.projectId]);
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
