import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
	router = inject(Router);
	elementRef = inject(ElementRef);
	isOpen = false;

	toggleDropdown() {
		this.isOpen = !this.isOpen;
	}

	@HostListener('document:click', ['$event'])
	onDocumentClick(event: Event) {
		if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
			this.isOpen = false;
		}
	}

	logout() {
		this.authService.logout();
		this.isOpen = false;
	}
}
