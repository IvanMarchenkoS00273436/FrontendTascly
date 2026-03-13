import { Component, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkspacesService } from '../../data/services/workspaces-service';
import { Auth } from '../../auth/auth';
import { switchMap, tap } from 'rxjs';

@Component({
    selector: 'app-workspace-overview',
    standalone: true,
    imports: [AsyncPipe, CommonModule],
    templateUrl: './workspace-overview.html',
    styleUrl: './workspace-overview.css',
})
export class WorkspaceOverview {
    route = inject(ActivatedRoute);
    router = inject(Router);
    workspacesService = inject(WorkspacesService);
    authService = inject(Auth);

    workspaceId = '';

    workspace$ = this.route.paramMap.pipe(
        tap(params => this.workspaceId = params.get('id')!),
        switchMap(params => this.workspacesService.getWorkspaceById(this.workspaceId))
    );

    get isOrgAdmin(): boolean {
        return this.authService.isAdmin;
    }

    isDeleteModalOpen = false;

    openDeleteModal() {
        this.isDeleteModalOpen = true;
    }

    closeDeleteModal() {
        this.isDeleteModalOpen = false;
    }

    deleteWorkspace() {
        this.workspacesService.deleteWorkspace(this.workspaceId).subscribe({
            next: () => {
                this.isDeleteModalOpen = false;
                this.router.navigate(['/dashboard/organization']);
            },
            error: (err) => {
                console.error("Failed to delete workspace", err);
                this.isDeleteModalOpen = false;
            }
        });
    }
}
