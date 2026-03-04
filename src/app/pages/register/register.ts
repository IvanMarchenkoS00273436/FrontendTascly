import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../auth/auth';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ReactiveFormsModule, RouterLink, CommonModule],
    templateUrl: './register.html',
    styleUrl: './register.css',
})
export class Register implements OnInit {
    authService = inject(Auth);
    router = inject(Router);
    route = inject(ActivatedRoute);

    // Invite mode
    isInviteMode = false;
    inviteToken: string | null = null;

    errorMessage: string | null = null;
    successMessage: string | null = null;

    form: FormGroup = new FormGroup({
        email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
        password: new FormControl<string | null>(null, Validators.required),
        firstName: new FormControl<string | null>(null, Validators.required),
        lastName: new FormControl<string | null>(null, Validators.required),
        organization: new FormControl<string | null>(null),
        confirmPassword: new FormControl<string | null>(null, Validators.required)
    });

    ngOnInit() {
        this.inviteToken = this.route.snapshot.queryParamMap.get('inviteToken');
        if (this.inviteToken) {
            this.isInviteMode = true;
            // Organization not needed for invite flow
            this.form.get('organization')?.clearValidators();
            this.form.get('organization')?.updateValueAndValidity();
        } else {
            // Org is required for normal admin registration
            this.form.get('organization')?.setValidators(Validators.required);
            this.form.get('organization')?.updateValueAndValidity();
        }
    }

    onRegister() {
        this.errorMessage = null;

        if (this.form.valid) {
            if (this.form.value.password !== this.form.value.confirmPassword) {
                this.errorMessage = 'Passwords do not match';
                return;
            }

            if (this.isInviteMode && this.inviteToken) {
                // Invite registration — no org name needed
                const payload = {
                    inviteToken: this.inviteToken,
                    username: this.form.value.email,
                    password: this.form.value.password,
                    firstName: this.form.value.firstName,
                    lastName: this.form.value.lastName,
                };
                this.authService.registerWithInvite(payload).subscribe({
                    next: () => this.showSuccess('Account created! You can now log in.'),
                    error: (err: any) => {
                        this.errorMessage = typeof err.error === 'string' ? err.error : 'Registration failed. Please try again.';
                    }
                });
            } else {
                // Normal admin registration — creates a new org
                const payload = {
                    username: this.form.value.email,
                    password: this.form.value.password,
                    firstName: this.form.value.firstName,
                    lastName: this.form.value.lastName,
                    organizationName: this.form.value.organization
                };
                this.authService.register(payload).subscribe({
                    next: () => this.showSuccess('You are registered successfully!'),
                    error: (err: any) => {
                        this.errorMessage = typeof err.error === 'string' ? err.error : 'Registration failed. Please try again.';
                    }
                });
            }
        } else {
            this.form.markAllAsTouched();
        }
    }

    showSuccess(message: string) {
        this.successMessage = message;
    }

    closeSuccess() {
        this.successMessage = null;
        this.router.navigate(['/login']);
    }
}
