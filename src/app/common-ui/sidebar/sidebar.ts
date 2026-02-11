import { AsyncPipe, UpperCasePipe } from '@angular/common'; 
import { Component, inject } from '@angular/core';
import { WorkspacesService } from '../../data/services/workspaces-service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsersService } from '../../data/services/users-service';

@Component({
    selector: 'app-sidebar',
    imports: [AsyncPipe, UpperCasePipe, RouterLink, RouterLinkActive],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.css',
})

export class Sidebar {
    workspacesService = inject(WorkspacesService);
    userService = inject(UsersService);

    $workspaces = this.workspacesService.getWorkspaces();
    $userProfile = this.userService.getUserProfile();

    expandedWorkspaceIds = new Set<string>();

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
}