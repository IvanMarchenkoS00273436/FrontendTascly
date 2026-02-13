import { AsyncPipe, UpperCasePipe } from '@angular/common'; 
import { Component, inject, resource, signal } from '@angular/core'; 
import { WorkspacesService } from '../../data/services/workspaces-service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsersService } from '../../data/services/users-service';
import { ProjectsService } from '../../data/services/projects-service'; 
import { FormsModule } from '@angular/forms'; 
import { tap, firstValueFrom } from 'rxjs'; // Removed switchMap to simplify
import { GetProject } from '../../data/interfaces/projects/get-project'; 

@Component({
    selector: 'app-sidebar',
    imports: [AsyncPipe, UpperCasePipe, RouterLink, RouterLinkActive, FormsModule],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.css',
})
export class Sidebar {
    workspacesService = inject(WorkspacesService);
    userService = inject(UsersService);
    projectsService = inject(ProjectsService);

    // Resource API for workspaces
    workspaces = resource({ loader: () => firstValueFrom(this.workspacesService.getWorkspaces()) });

    // Signal that holds ALL projects keyed by workspace ID
    projectsMap = signal<Record<string, GetProject[]>>({});

    // Read signal directly for template usage
    getProjects(workspaceId: string): GetProject[] {
        return this.projectsMap()[workspaceId] ?? [];
    }

    $userProfile = this.userService.getUserProfile();

    expandedWorkspaceIds = new Set<string>();
    expandedProjectsIds = signal(new Set<string>());
    createProjectWorkspaceId = signal<string | null>(null);
    newProjectName = '';
    showCreateInput = false;
    newWorkspaceNameWS = '';

    toggleWorkspace(id: string) {
        if (this.expandedWorkspaceIds.has(id)) {
            this.expandedWorkspaceIds.delete(id);
        } else {
            this.expandedWorkspaceIds.add(id);
        }
    }

    isExpanded(id: string): boolean {
        return this.expandedWorkspaceIds.has(id);
    }

    toggleProjects(workspaceId: string) {
        const newExpanded = new Set(this.expandedProjectsIds());

        if (newExpanded.has(workspaceId)) {
            newExpanded.delete(workspaceId);
        } else {
            newExpanded.add(workspaceId);
            // Always reload when opening to ensure fresh data
            this.loadProjectsForWorkspace(workspaceId);
        }

        this.expandedProjectsIds.set(newExpanded);
    }

    isProjectsExpanded(workspaceId: string): boolean {
        return this.expandedProjectsIds().has(workspaceId);
    }

    loadProjectsForWorkspace(workspaceId: string) {
        this.projectsService.getWorkspaceProjects(workspaceId).subscribe({
            next: (projects) => {
                // Force a new object reference to trigger change detection
                const currentMap = this.projectsMap();
                this.projectsMap.set({
                    ...currentMap,
                    [workspaceId]: projects
                });
            },
            error: (err) => console.error(`Failed to load projects for ${workspaceId}`, err)
        });
    }

    toggleCreateProject(wsId: string, event: Event) {
        event.stopPropagation(); 
        event.preventDefault(); 

        if (this.createProjectWorkspaceId() === wsId) {
            this.createProjectWorkspaceId.set(null);
        } else {
            this.createProjectWorkspaceId.set(wsId);
            this.newProjectName = '';
            if (!this.expandedProjectsIds().has(wsId)) {
                this.toggleProjects(wsId);
            }
        }
    }

    createProject(wsId: string) {
        if (!this.newProjectName.trim()) return;

        this.projectsService.postWorkspaceProject(wsId, { 
            name: this.newProjectName,
            description: "" 
        }).subscribe({
            next: () => {
                // 1. Reload the data explicitly (same as opening the dropdown)
                this.loadProjectsForWorkspace(wsId);
                // 2. Reset UI state
                this.createProjectWorkspaceId.set(null);
                this.newProjectName = '';
            },
            error: (err) => console.error('Failed to create project', err)
        });
    }

    toggleCreateInput() {
        this.showCreateInput = !this.showCreateInput;
        this.newWorkspaceNameWS = '';
    }

    createWorkspace() {
        if (!this.newWorkspaceNameWS.trim()) return;

        this.workspacesService.postWorkspace({ name: this.newWorkspaceNameWS }).pipe(
            tap(() => {
                this.workspaces.reload();
                this.toggleCreateInput(); 
            })
        ).subscribe({
            error: (err) => console.error('Failed to create workspace', err)
        });
    }
}