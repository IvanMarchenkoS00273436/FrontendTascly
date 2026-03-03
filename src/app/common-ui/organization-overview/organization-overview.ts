import { Component, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationsService } from '../../data/services/organizations-service';
import { Auth } from '../../auth/auth';
import { BehaviorSubject, switchMap, tap } from 'rxjs';

@Component({
    selector: 'app-organization-overview',
    standalone: true,
    imports: [AsyncPipe, CommonModule, FormsModule],
    templateUrl: './organization-overview.html',
    styleUrl: './organization-overview.css',
})
export class OrganizationOverview {
    organizationService = inject(OrganizationsService);
    authService = inject(Auth);

    private refreshTrigger = new BehaviorSubject<void>(undefined);

    $organization = this.refreshTrigger.pipe(
        switchMap(() => this.organizationService.getOrganizationOverview())
    );

    // Edit org name state
    isEditingName = false;
    editedName = '';

    // Invite state
    inviteEmail = '';
    inviteIsOrgAdmin = false;
    inviteStatus: 'idle' | 'loading' | 'success' | 'error' = 'idle';
    inviteMessage = '';

    get isAdmin(): boolean {
        return this.authService.isAdmin;
    }

    startEditing(currentName: string) {
        this.editedName = currentName;
        this.isEditingName = true;
    }

    cancelEdit() {
        this.isEditingName = false;
        this.editedName = '';
    }

    saveName() {
        if (!this.editedName.trim()) return;

        this.organizationService.putOrganization({ name: this.editedName }).pipe(
            tap(() => {
                this.isEditingName = false;
                this.refreshTrigger.next();
            })
        ).subscribe({
            error: (err) => console.error('Failed to update organization name', err)
        });
    }

    sendInvite() {
        if (!this.inviteEmail.trim()) return;

        this.inviteStatus = 'loading';
        this.inviteMessage = '';

        this.organizationService.inviteMember({ email: this.inviteEmail, isOrgAdmin: this.inviteIsOrgAdmin }).subscribe({
            next: () => {
                this.inviteStatus = 'success';
                this.inviteMessage = `Invite sent to ${this.inviteEmail}!`;
                this.inviteEmail = '';
                this.inviteIsOrgAdmin = false;
                // Reset back to idle after 4s
                setTimeout(() => this.inviteStatus = 'idle', 4000);
            },
            error: (err) => {
                this.inviteStatus = 'error';
                this.inviteMessage = typeof err.error === 'string' ? err.error : 'Failed to send invite.';
            }
        });
    }
}
