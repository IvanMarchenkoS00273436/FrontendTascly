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
    form: FormGroup = new FormGroup({
        username: new FormControl<string | null>(null, Validators.required),
        password: new FormControl<string | null>(null, Validators.required)
    })

    onSubmit() {
        if(this.form.valid) {
            console.log(this.form.value);
            this.authService.login(this.form.value).subscribe(res =>{
                this.router.navigate(['/dashboard']);
                console.log(res);
            })
        }
    }
}
