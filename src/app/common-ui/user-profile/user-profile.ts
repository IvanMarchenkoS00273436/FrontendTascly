import { Component, inject } from '@angular/core';
import { UsersService } from '../../data/services/users-service';
import { AsyncPipe, UpperCasePipe } from '@angular/common';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [AsyncPipe, UpperCasePipe],
    templateUrl: './user-profile.html',
    styleUrl: './user-profile.css',
})

export class UserProfile {
    userService: UsersService = inject(UsersService);
    $user = this.userService.getUserProfile();
}
