import { Component, inject, resource, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WorkspacesService } from '../../data/services/workspaces-service';
import { UsersService } from '../../data/services/users-service';
import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { Observable, firstValueFrom, switchMap, tap } from 'rxjs';
import { GetMemberRoleDto } from '../../data/interfaces/Workspaces/get-member-role-dto';
import { GetUserProfile } from '../../data/interfaces/Users/get-user-profile';
import { FormsModule } from '@angular/forms'; 
import { PostMemberToWorkspace } from '../../data/interfaces/Workspaces/post-member-to-workspace';

@Component({
    selector: 'app-workspace-members',
    standalone: true,
    imports: [AsyncPipe, UpperCasePipe, FormsModule],
    templateUrl: './workspace-members.html',
    styleUrl: './workspace-members.css'
})
export class WorkspaceMembers {
    route = inject(ActivatedRoute);
    workspaceService = inject(WorkspacesService);
    usersService = inject(UsersService);

    workspaceId: string = '';

    // Modal State
    isAssignModalOpen = false;
    selectedUserId: string = '';
    selectedRole: string = 'Limited-access';

    // Helper options for Roles
    availableRoles = ["Admin", "Full-access", "Limited-access"];


    members$: Observable<GetMemberRoleDto[]> = new Observable<GetMemberRoleDto[]>();

    ngOnInit() { this.loadMembers(); }


    // List of all users to populate the dropdown
    allUsers$: Observable<GetUserProfile[]> = this.usersService.getAllUsers();

    openAssignModal() {
        this.isAssignModalOpen = true;
        this.selectedUserId = '';
        this.selectedRole = 'Limited-access';
    }

    closeAssignModal() {
        this.isAssignModalOpen = false;
    }

    assignMember() {
        if (!this.selectedUserId || !this.selectedRole) return;

        const payload: PostMemberToWorkspace = {
            memberId: this.selectedUserId,
            roleName: this.selectedRole
        };

        this.workspaceService.postMemberToWorkspace(this.workspaceId, payload).subscribe({
            next: () => {
                this.closeAssignModal();
                this.loadMembers();
            },
            error: (err) => console.error("Failed to assign member", err)
        });
    }

    loadMembers() {
        this.members$ = this.route.paramMap.pipe(
            tap(params => this.workspaceId = params.get('id')!), 
            switchMap(params => {
                const id = params.get('id');
                return this.workspaceService.getMembersRoles(id!);
            })
        );
    }
}
