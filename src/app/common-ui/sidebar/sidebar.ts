import { AsyncPipe, UpperCasePipe } from '@angular/common'; 
import { Component, inject } from '@angular/core';
import { WorkspacesService } from '../../data/services/workspaces-service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsersService } from '../../data/services/users-service';
import { FormsModule } from '@angular/forms'; 
import { tap } from 'rxjs';

@Component({
    selector: 'app-sidebar',
    imports: [AsyncPipe, UpperCasePipe, RouterLink, RouterLinkActive, FormsModule],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.css',
})

export class Sidebar {
    workspacesService = inject(WorkspacesService);
    userService = inject(UsersService);

    $workspaces = this.workspacesService.getWorkspaces();
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

        // To be fixed maybe
        location.reload();

        this.workspacesService.postWorkspace({ name: this.newWorkspaceName }).pipe(
            tap(() => {
                this.$workspaces = this.workspacesService.getWorkspaces();
                this.toggleCreateInput(); 
            })
        ).subscribe({
            error: (err) => console.error('Failed to create workspace', err)
        });

        
    }
}