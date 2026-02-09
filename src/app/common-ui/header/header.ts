import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../auth/auth';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-header',
	standalone: true,
	imports: [RouterLink, CommonModule],
	templateUrl: './header.html',
	styleUrl: './header.css',
})

export class Header {
	authService = inject(Auth);
	isOpen = false;

	toggleDropdown() {
		this.isOpen = !this.isOpen;
	}

	logout() {
		this.authService.logout();
		this.isOpen = false;
	}
}
