import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../auth/auth';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './register.html',
    styleUrl: './register.css',
})
export class Register {
    authService = inject(Auth);
    router = inject(Router);
    
    errorMessage: string | null = null;
    successMessage: string | null = null;

    form: FormGroup = new FormGroup({
        email: new FormControl<string | null>(null, Validators.required),
        password: new FormControl<string | null>(null, Validators.required),
        firstName: new FormControl<string | null>(null, Validators.required),
        lastName: new FormControl<string | null>(null, Validators.required),
        organization: new FormControl<string | null>(null, Validators.required),
        confirmPassword: new FormControl<string | null>(null, Validators.required)
    })

    onRegister() {
        if (!this.form.value.firstName 
            || !this.form.value.lastName 
            || !this.form.value.email 
            || !this.form.value.password 
            || !this.form.value.organization) {
            this.showError('Please fill in all fields');
            return;
        }

        if (this.form.value.password !== this.form.value.confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        const payload = {
            username: this.form.value.email,
            password: this.form.value.password,
            firstName: this.form.value.firstName,
            lastName: this.form.value.lastName,
            organizationName: this.form.value.organization
        };

        console.log('Registration Payload:', payload);

        this.authService.register(payload).subscribe({
            next: () => {
                this.showSuccess("You are registered successfully !"); 
            },
            error: (err) => {
                console.error(err);
                const backendMessage = typeof err.error === 'string' ? err.error : "Registration failed. Please try again.";
                this.showError(backendMessage);
            }
        });
    }

    showError(message: string) {
        this.errorMessage = message;
    }

    closeError() {
        this.errorMessage = null;
    }

    showSuccess(message: string) {
        this.successMessage = message;
    }

    closeSuccess() {
        this.successMessage = null;
        this.router.navigate(['/login']);
    }
}
