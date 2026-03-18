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
    
    // Controls the inline error API message
    errorMessage: string | null = null;

    form: FormGroup = new FormGroup({
        username: new FormControl<string | null>(null, [Validators.required]),
        password: new FormControl<string | null>(null, Validators.required)
    })

    onSubmit() {
        this.errorMessage = null;

        if (this.form.valid) {
            this.authService.login(this.form.value).subscribe({
                next: (res) => {
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    console.error(err);
                    this.errorMessage = "Email or password wrong";
                }
            })
        } else {
            this.form.markAllAsTouched(); 
        }
    }
}
