import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { canActivateAuth } from './auth/access-guard';
import { WorkspaceMembers } from './common-ui/workspace-members/workspace-members';
import { UserProfile } from './common-ui/user-profile/user-profile';
import { OrganizationOverview } from './common-ui/organization-overview/organization-overview';
import { TasksKanbanView } from './common-ui/tasks-kanban-view/tasks-kanban-view';
import { AIPromptComponent } from './pages/ai-prompt/ai-prompt';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [canActivateAuth],
        children: [
            { path: '', redirectTo: 'organization', pathMatch: 'full' },
            { path: 'profile', component: UserProfile },
            { path: 'organization', component: OrganizationOverview },
            { path: ':id/members', component: WorkspaceMembers },
            { path: 'projects/:id', component: TasksKanbanView },
            { path: 'ai-task-generator', component: AIPromptComponent }
        ]
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];