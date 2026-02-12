import { AsyncPipe, UpperCasePipe } from '@angular/common'; 
import { Component, inject, resource } from '@angular/core'; // Added resource
import { WorkspacesService } from '../../data/services/workspaces-service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsersService } from '../../data/services/users-service';
import { FormsModule } from '@angular/forms'; 
import { tap, firstValueFrom } from 'rxjs'; // Added firstValueFrom

@Component({
    selector: 'app-sidebar',
    imports: [AsyncPipe, UpperCasePipe, RouterLink, RouterLinkActive, FormsModule],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.css',
})

export class Sidebar {
    workspacesService = inject(WorkspacesService);
    userService = inject(UsersService);

    // Resource API for workspaces
    workspaces = resource({ loader: () => firstValueFrom(this.workspacesService.getWorkspaces()) });

    $userProfile = this.userService.getUserProfile();

    expandedWorkspaceIds = new Set<string>();

    // Create Workspace State
    showCreateInput = false;
    newWorkspaceName = '';

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

    toggleCreateInput() {
        this.showCreateInput = !this.showCreateInput;
        this.newWorkspaceName = '';
    }

    createWorkspace() {
        if (!this.newWorkspaceName.trim()) return;

        this.workspacesService.postWorkspace({ name: this.newWorkspaceName }).pipe(
            tap(() => {
                this.workspaces.reload();
                this.toggleCreateInput(); 
            })
        ).subscribe({
            error: (err) => console.error('Failed to create workspace', err)
        });
    }
}