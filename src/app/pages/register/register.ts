import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [FormsModule, RouterLink],
    templateUrl: './register.html',
    styleUrl: './register.css',
})
export class Register {
    formData = {
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        organization: ''
    };

    onRegister() {
        if (this.formData.password !== this.formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (this.formData.email && this.formData.password) {
            console.log('Registration attempt:', this.formData);
            // Implement registration logic here
        }
    }
}
