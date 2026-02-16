import { Component, inject } from '@angular/core';
import { AsyncPipe, DatePipe, UpperCasePipe} from '@angular/common'; // Removed UpperCasePipe
import { ActivatedRoute } from '@angular/router';
import { TasksService } from '../../data/services/tasks-service';
import { map, switchMap } from 'rxjs';
import { GetTask } from '../../data/interfaces/tasks/get-task';

@Component({
  selector: 'app-tasks-kanban-view',
  standalone: true,
  imports: [AsyncPipe, DatePipe, UpperCasePipe],
  templateUrl: './tasks-kanban-view.html',
  styleUrl: './tasks-kanban-view.css',
})
export class TasksKanbanView {
  private route = inject(ActivatedRoute);
  private tasksService = inject(TasksService);

  columns = ['To Do', 'In Progress', 'Done'];

  tasks$ = this.route.paramMap.pipe(
    switchMap(params => {
        const projectId = params.get('id');
        // Ensure the service method is typed correctly to return Observable<GetTask[]>
        return this.tasksService.getTasksByProjectId(projectId!); 
    }),
    map((tasks: GetTask[]) => {
        const grouped: Record<string, GetTask[]> = {
            'To Do': [],
            'In Progress': [],
            'Done': []
        };
        
        if (Array.isArray(tasks)) {
            tasks.forEach(task => {
                const status = task.statusName || 'To Do';
                if (grouped[status]) {
                    grouped[status].push(task);
                } else {
                    // unexpected status, push to To Do or ignore
                    grouped['To Do'].push(task);
                }
            });
        }
        return grouped;
    })
  );
}
