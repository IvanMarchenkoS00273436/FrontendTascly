import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WorkspacesService } from '../../data/services/workspaces-service';
import { UsersService } from '../../data/services/users-service';
import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { Observable, switchMap, tap } from 'rxjs';
import { GetMemberRoleDto } from '../../data/interfaces/Workspaces/get-member-role-dto';
import { GetUserProfile } from '../../data/interfaces/Users/get-user-profile';
import { FormsModule } from '@angular/forms'; 

@Component({
    selector: 'app-workspace-members',
    standalone: true,
    imports: [AsyncPipe, UpperCasePipe, FormsModule], // Check if FormsModule is needed
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
    selectedRole: string = 'Limited-access'; // Default role

    // Helper options for Roles
    availableRoles = ["Admin", "Full-access", "Limited-access"];

    // Data Streams
    members$: Observable<GetMemberRoleDto[]> = this.route.paramMap.pipe(
        tap(params => this.workspaceId = params.get('id')!), 
        switchMap(params => {
            const id = params.get('id');
            return this.workspaceService.getMembersRoles(id!);
        })
    );

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

        const payload = {
            memberId: this.selectedUserId,
            roleName: this.selectedRole
        };

        // Note: The service method signature might need adjustment or Usage here relies on 
        // the provided service which takes { memberId, roleName } but the URL construction 
        // in service uses memberId in path as well. Ensure service is correct.
        this.workspaceService.postMemberToWorkspace(payload).subscribe({
            next: () => {
                this.closeAssignModal();
                // Refresh logic - simple force reload for now or re-trigger observable
                window.location.reload(); 
            },
            error: (err) => console.error("Failed to assign member", err)
        });
    }
}
