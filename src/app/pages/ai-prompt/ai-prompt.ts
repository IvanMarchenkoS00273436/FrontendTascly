import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiTaskGeneratorService } from '../../data/services/ai-task-generator.service';
import { VoiceInputService } from '../../data/services/voice-input.service';
import { Auth } from '../../auth/auth';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { WorkspacesService } from '../../data/services/workspaces-service';
import { ProjectsService } from '../../data/services/projects-service';
import { Getworkcpaces } from '../../data/interfaces/Workspaces/getworkcpaces';
import { GetProject } from '../../data/interfaces/projects/get-project';
import { GetMemberRoleDto } from '../../data/interfaces/Workspaces/get-member-role-dto';
import { AiMemberDto } from '../../data/interfaces/tasks/task.interface';

@Component({
    selector: 'app-ai-prompt',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-prompt.html',
    styleUrl: './ai-prompt.css'
})
export class AIPromptComponent {
    aiService = inject(AiTaskGeneratorService);
    voiceService = inject(VoiceInputService);
    private authService = inject(Auth);
    private route = inject(ActivatedRoute);
    private workspacesService = inject(WorkspacesService);
    private projectsService = inject(ProjectsService);

    promptText = signal<string>('');
    isListening = signal<boolean>(false);
    private voiceSub?: Subscription;

    selectedProjectId = signal<string>('');
    selectedWorkspaceId = signal<string>('');
    lockedFromProject = signal<boolean>(false);  // true when navigated from a project board

    workspaces = signal<Getworkcpaces[]>([]);
    projects = signal<GetProject[]>([]);
    members = signal<GetMemberRoleDto[]>([]);

    isProcessing = this.aiService.isProcessing;
    errorMessage = this.aiService.errorSignal;
    draftTasks = this.aiService.draftTasks;

    examplePrompts = [
        'Build a user authentication system with email verification and password reset',
        'Create a dashboard with charts showing sales data for the last 30 days',
        'Implement a file upload feature with drag-and-drop and progress tracking',
        'Add a notification system with real-time updates and email alerts'
    ];

    constructor() {
        this.route.queryParams.subscribe(params => {
            const pid = params['projectId'];
            const wid = params['workspaceId'];

            if (pid && wid) {
                // Came from a project board — lock directly to this workspace + project
                this.lockedFromProject.set(true);
                this.selectedWorkspaceId.set(wid);
                this.selectedProjectId.set(pid);

                // Load projects for the workspace and members
                this.projectsService.getWorkspaceProjects(wid).subscribe(p => this.projects.set(p));
                this.workspacesService.getMembersRoles(wid).subscribe(m => this.members.set(m));
            } else {
                // Normal navigation — load all workspaces for manual selection
                this.workspacesService.getWorkspaces().subscribe(ws => this.workspaces.set(ws));
            }
        });
    }

    get lockedProjectName(): string {
        return this.projects().find(p => p.id === this.selectedProjectId())?.name || 'Project';
    }

    onWorkspaceChange(workspaceId: string) {
        this.selectedWorkspaceId.set(workspaceId);
        this.selectedProjectId.set('');
        this.projects.set([]);
        this.members.set([]);
        if (workspaceId) {
            this.projectsService.getWorkspaceProjects(workspaceId).subscribe(p => {
                this.projects.set(p);
            });
            this.workspacesService.getMembersRoles(workspaceId).subscribe(m => {
                this.members.set(m);
            });
        }
    }

    async generateTasks() {
        const prompt = this.promptText();
        if (!prompt?.trim()) {
            this.errorMessage.set('Please enter a description of what you need');
            return;
        }
        const projectId = this.selectedProjectId();
        if (!projectId) {
            this.errorMessage.set('Please select a project first');
            return;
        }
        // Build member list for AI context
        const members: AiMemberDto[] = this.members().map(m => ({
            id: m.memberId,
            fullName: `${m.firstName} ${m.lastName}`
        }));
        await this.aiService.generateTasks(prompt, projectId, members);
        if (this.aiService.getDraftTaskCount() > 0) {
            this.promptText.set('');
        }
    }

    async confirmAllTasks() {
        const projectId = this.selectedProjectId();
        if (!projectId) return;
        const success = await this.aiService.confirmTasks(this.draftTasks(), projectId);
        if (success) {
            this.errorMessage.set(null);
        }
    }

    removeDraftTask(tempId: number) {
        this.aiService.removeDraftTask(tempId);
    }

    startVoiceInput() {
        if (!this.voiceService.isSupported()) {
            this.errorMessage.set('Voice input is not supported in your browser');
            return;
        }
        this.isListening.set(true);
        this.voiceSub = this.voiceService.startListening().subscribe({
            next: (transcript) => {
                const current = this.promptText();
                this.promptText.set(current ? `${current} ${transcript}` : transcript);
                this.isListening.set(false);
            },
            error: () => {
                this.errorMessage.set('Voice input failed. Please try again.');
                this.isListening.set(false);
            }
        });
    }

    stopVoiceInput() {
        this.voiceService.stopListening();
        this.isListening.set(false);
    }

    useExamplePrompt(example: string) {
        this.promptText.set(example);
    }

    clearPrompt() {
        this.promptText.set('');
        this.errorMessage.set(null);
        this.aiService.clearDraftTasks();
    }

    isGenerateDisabled(): boolean {
        return !this.promptText()?.trim() || this.isProcessing() || !this.selectedProjectId();
    }

    getImportanceLabel(id: number): string {
        return id === 3 ? 'High' : id === 2 ? 'Medium' : 'Low';
    }

    getImportanceClass(id: number): string {
        return id === 3 ? 'high' : id === 2 ? 'medium' : 'low';
    }

    getAssigneeName(assigneeId: string | undefined): string {
        if (!assigneeId) return 'Unassigned';
        const member = this.members().find(m => m.memberId === assigneeId);
        return member ? `${member.firstName} ${member.lastName}` : 'Unassigned';
    }

    onAssigneeChange(tempId: number, assigneeId: string) {
        this.aiService.updateDraftTask(tempId, 'assigneeId', assigneeId || undefined);
    }
}