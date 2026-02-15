import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WorkspacesService } from '../../data/services/workspaces-service';
import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { Observable, switchMap } from 'rxjs';
import { GetMemberRoleDto } from '../../data/interfaces/Workspaces/get-member-role-dto';

@Component({
    selector: 'app-workspace-members',
    standalone: true,
    imports: [AsyncPipe, UpperCasePipe],
    templateUrl: './workspace-members.html',
    styleUrl: './workspace-members.css'
})
export class WorkspaceMembers {
    route = inject(ActivatedRoute);
    workspaceService = inject(WorkspacesService);

    members$: Observable<GetMemberRoleDto[]> = this.route.paramMap.pipe(
        switchMap(params => {
            const id = params.get('id');
            return this.workspaceService.getMembersRoles(id!);
        })
    );
}
