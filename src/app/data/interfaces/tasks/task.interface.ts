export interface DraftTask {
    tempId: number; // Temporary ID for client-side management
    name: string;
    description: string;
    dueDate?: Date;
    startDate?: Date;
    importanceId: number;
    statusId: number;
    assigneeId?: string;
}

export interface AiMemberDto {
    id: string;
    fullName: string;
}

export interface AiGenerateRequest {
    prompt: string;
    projectId: string;
    mode: string;
    members: AiMemberDto[];
}

export interface AiGenerateResponse {
    tasks: DraftTask[];
}

export interface BulkCreateRequest {
    tasks: DraftTask[];
    projectId: string;
}

