import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../auth/auth';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class Login {
    authService = inject(Auth);
    router = inject(Router);
    
    // Variable to control the popup logic
    errorMessage: string | null = null;

    form: FormGroup = new FormGroup({
        username: new FormControl<string | null>(null, Validators.required),
        password: new FormControl<string | null>(null, Validators.required)
    })

    onSubmit() {
        // 1. Check if form is valid (not empty)
        if (this.form.valid) {
            this.authService.login(this.form.value).subscribe({
                next: (res) => {
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    console.error(err);
                    // 2. Show popup for wrong credentials
                    this.showError("Email or password wrong");
                }
            })
        } else {
            // 3. Keep form valid check but show popup if user tries to submit empty
            this.form.markAllAsTouched(); // Highlights red inputs
            this.showError("Please fill in both email and password");
        }
    }

    showError(message: string) {
        this.errorMessage = message;
    }

    closeError() {
        this.errorMessage = null;
    }
}
