import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
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

@Component({
    selector: 'app-ai-prompt',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-prompt.html',
    styleUrl: './ai-prompt.css'
})
export class AIPromptComponent implements OnInit, OnDestroy {
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

    workspaces = signal<Getworkcpaces[]>([]);
    projects = signal<GetProject[]>([]);

    isProcessing = this.aiService.isProcessing;
    errorMessage = this.aiService.errorSignal;
    draftTasks = this.aiService.draftTasks;

    examplePrompts = [
        'Build a user authentication system with email verification and password reset',
        'Create a dashboard with charts showing sales data for the last 30 days',
        'Implement a file upload feature with drag-and-drop and progress tracking',
        'Add a notification system with real-time updates and email alerts'
    ];

    ngOnInit() {
        if (!this.voiceService.isSupported()) {
            console.warn('Voice input is not supported in this browser');
        }

        // Load workspaces for the dropdown
        this.workspacesService.getWorkspaces().subscribe(ws => {
            this.workspaces.set(ws);
        });

        // Read projectId from URL if provided
        this.route.queryParams.subscribe(params => {
            const pid = params['projectId'];
            if (pid) {
                this.selectedProjectId.set(pid);
            }
        });
    }

    ngOnDestroy() {
        this.voiceSub?.unsubscribe();
    }

    onWorkspaceChange(workspaceId: string) {
        this.selectedWorkspaceId.set(workspaceId);
        this.selectedProjectId.set('');
        this.projects.set([]);
        if (workspaceId) {
            this.projectsService.getWorkspaceProjects(workspaceId).subscribe(p => {
                this.projects.set(p);
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
        await this.aiService.generateTasks(prompt, projectId);
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
}