import { Component } from '@angular/core';
import { Sidebar } from '../../common-ui/sidebar/sidebar';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    imports: [Sidebar, RouterOutlet],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
})

export class Dashboard {
    
}
