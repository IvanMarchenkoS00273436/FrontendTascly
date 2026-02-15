import { Component, inject } from '@angular/core';
import { UsersService } from '../../data/services/users-service';
import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PutUserProfile } from '../../data/interfaces/Users/put-user-profile';
import { tap } from 'rxjs';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [AsyncPipe, UpperCasePipe, ReactiveFormsModule],
    templateUrl: './user-profile.html',
    styleUrl: './user-profile.css',
})

export class UserProfile {
    userService: UsersService = inject(UsersService);
    fb = inject(FormBuilder);
    
    $user = this.userService.getUserProfile();
    
    // State management
    isEditing = false;
    successMessage: string | null = null;
    errorMessage: string | null = null;

    // Form initialization
    form: FormGroup = this.fb.group({
        firstName: [''],
        lastName: [''],
        userName: [''], // This maps to email in UI
        password: [''],   // Current password (required for password change usually, but adhering to specific dto structure)
        newPassword: ['']
    });

    toggleEditMode() {
        this.isEditing = !this.isEditing;
        this.successMessage = null;
        this.errorMessage = null;
        this.form.reset({
            firstName: '',
            lastName: '',
            userName: '',
            password: '',
            newPassword: ''
        });
    }

    onSubmit() {
        this.successMessage = null;
        this.errorMessage = null;

        // Construct payload: empty string if field is null/undefined/empty
        const formVal = this.form.value;
        const payload: PutUserProfile = {
            firstName: formVal.firstName || "",
            lastName: formVal.lastName || "",
            userName: formVal.userName || "",
            password: formVal.password || "",
            newPassword: formVal.newPassword || ""
        };

        // If all fields are empty, do nothing
        if (Object.values(payload).every(val => val === "")) {
            this.errorMessage = "Please fill at least one field to update.";
            return;
        }

        this.userService.putUserProfile(payload).pipe(
            tap(() => {
                // Refresh user data stream
                this.$user = this.userService.getUserProfile();
            })
        ).subscribe({
            next: () => {
                this.successMessage = "Profile updated successfully!";
                this.isEditing = false;
                this.form.reset();
            },
            error: (err) => {
                console.error(err);
                this.errorMessage = "Failed to update profile. Please try again.";
            }
        });
    }
}
