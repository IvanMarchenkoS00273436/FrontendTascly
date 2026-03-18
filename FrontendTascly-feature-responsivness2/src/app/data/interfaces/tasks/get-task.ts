export interface GetTask {
    id: string;
    name: string;
    description: string;
    startDate: Date;
    dueDate: Date;
    creationDate: Date;
    completionDate?: Date;
    lastModifiedDate: Date;
    statusName: string;
    importanceName: string;
    projectId: string;
    authorId: string;
    assigneeId: string;
}
