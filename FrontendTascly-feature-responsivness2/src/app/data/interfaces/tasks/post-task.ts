export interface PostTask {
    name: string;
    description: string;
    startDate: Date;
    dueDate: Date;
    statusId: number;
    importanceId: number;
    assigneeId?: string | null; 
}