export interface DraftTask {
    tempId: number; // Temporary ID for client-side management
    name: string;
    description: string;
    dueDate?: Date;
    startDate?: Date;
    importancId: Number;
    statusId: Number;
    assigneeId?: string;
}

export interface AiGenerateRequest {
    prompt: string;
    projectId: string;
    mode: string;
}   

export interface AiGenerateResponse {
    tasks: DraftTask[];
}

export interface BulkCreateRequest {
    tasks: DraftTask[];
    projectId: string;
}

