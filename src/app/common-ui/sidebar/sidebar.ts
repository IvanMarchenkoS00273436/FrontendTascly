import { AsyncPipe, UpperCasePipe } from '@angular/common'; 
import { Component, inject } from '@angular/core';
import { WorkspacesService } from '../../data/services/workspaces-service';

@Component({
    selector: 'app-sidebar',
    imports: [AsyncPipe, UpperCasePipe],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.css',
})

export class Sidebar {
    workspacesService = inject(WorkspacesService);
    $workspaces = this.workspacesService.getWorkspaces();

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