import { Component, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Added FormsModule
import { OrganizationsService } from '../../data/services/organizations-service';
import { BehaviorSubject, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-organization-overview',
  standalone: true,
  imports: [AsyncPipe, CommonModule, FormsModule], // Added FormsModule
  templateUrl: './organization-overview.html',
  styleUrl: './organization-overview.css',
})
export class OrganizationOverview {
    organizationService = inject(OrganizationsService);
    
    // Refresh trigger to reload data after updates
    private refreshTrigger = new BehaviorSubject<void>(undefined);
    
    $organization = this.refreshTrigger.pipe(
        switchMap(() => this.organizationService.getOrganizationOverview())
    );

    // Edit State
    isEditingName = false;
    editedName = '';

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
                this.refreshTrigger.next(); // Reload data
            })
        ).subscribe({
            error: (err) => console.error('Failed to update organization name', err)
        });
    }
}
