import { Component, HostListener, inject, resource, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WorkspacesService } from '../../data/services/workspaces-service';
import { UsersService } from '../../data/services/users-service';
import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { Observable, firstValueFrom, switchMap, tap } from 'rxjs';
import { GetMemberRoleDto } from '../../data/interfaces/Workspaces/get-member-role-dto';
import { GetUserProfile } from '../../data/interfaces/Users/get-user-profile';
import { FormsModule } from '@angular/forms'; 
import { PostMemberToWorkspace } from '../../data/interfaces/Workspaces/post-member-to-workspace';
import { PutMemberWithNewRoleDto } from '../../data/interfaces/Workspaces/put-member-with-new-role-dto';

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

    currentUserRole = signal<string | null>(null);

    // Helper options for Roles
    availableRoles = ["Admin", "Full-access", "Limited-access"];

    // Member Menu State
    openMenuMemberId = signal<string | null>(null);

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

    toggleMemberMenu(memberId: string, event: Event) {
        event.stopPropagation();
        if (this.openMenuMemberId() === memberId) {
            this.openMenuMemberId.set(null);
        } else {
            this.openMenuMemberId.set(memberId);
        }
    }

    closeMemberMenu() {
        this.openMenuMemberId.set(null);
    }

    deleteMember(memberId: string) {
        this.closeMemberMenu();
        this.workspaceService.deleteMemberFromWorkspace(this.workspaceId, memberId).subscribe({
            next: () => {
                this.loadMembers();
            },
            error: (err) => console.error("Failed to delete member", err)
        });
    }

    editMemberRole(member: GetMemberRoleDto) {
        this.closeMemberMenu();
        this.selectedUserId = member.memberId;
        this.selectedRole = member.role.name || 'Limited-access';
        this.isEditRoleModalOpen = true;
    }

    // Edit Role Modal State
    isEditRoleModalOpen = false;

    closeEditRoleModal() {
        this.isEditRoleModalOpen = false;
        this.selectedUserId = '';
    }

    confirmEditRole() {
        if (!this.selectedUserId || !this.selectedRole) return;

        const roleId = this.roleIdMap[this.selectedRole];
        if (!roleId) {
            console.error('Unknown role:', this.selectedRole);
            return;
        }

        const payload: PutMemberWithNewRoleDto = {
            userId: this.selectedUserId,
            newRoleId: roleId
        };

        const wsId = this.workspaceId;
        this.closeEditRoleModal();

        this.workspaceService.putMemberWithNewRole(wsId, payload).subscribe({
            next: () => {
                this.loadMembers();
            },
            error: (err) => {
                console.error("Failed to update role", err);
                this.loadMembers();
            }
        });
    }

    // Role name → Role ID mapping
    roleIdMap: Record<string, string> = {
        'Limited-access': 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        'Full-access': 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Admin': 'dddddddd-dddd-dddd-dddd-dddddddddddd'
    };

    @HostListener('document:click')
    onDocumentClick() {
        this.closeMemberMenu();
    }

    loadMembers() {
        this.members$ = this.route.paramMap.pipe(
            tap(params => {
                this.workspaceId = params.get('id')!;
                // Load current user's role in this workspace
                this.workspaceService.getWorkspaceMemberRole(this.workspaceId).subscribe({
                    next: (role) => this.currentUserRole.set(role.name),
                    error: () => this.currentUserRole.set('Unknown')
                });
            }),
            switchMap(params => {
                const id = params.get('id');
                return this.workspaceService.getMembersRoles(id!);
            })
        );
    }
}
