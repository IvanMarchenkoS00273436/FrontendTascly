import { Component, inject } from '@angular/core';
import { AsyncPipe, DatePipe, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksService } from '../../data/services/tasks-service';
import { switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-tasks-table-view',
  standalone: true,
  imports: [AsyncPipe, DatePipe, CommonModule],
  templateUrl: './tasks-table-view.html',
  styleUrl: './tasks-table-view.css'
})
export class TasksTableView {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tasksService = inject(TasksService);

  projectId = '';

  tasks$ = this.route.paramMap.pipe(
    tap(params => this.projectId = params.get('id')!),
    switchMap(params => this.tasksService.getTasksByProjectId(this.projectId))
  );

  navigateToBoard() {
    this.router.navigate(['/dashboard/projects', this.projectId]);
  }

  navigateToCalendar() {
    this.router.navigate(['/dashboard/projects', this.projectId, 'calendar']);
  }
}
