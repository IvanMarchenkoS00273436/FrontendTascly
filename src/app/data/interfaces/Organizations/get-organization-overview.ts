import { GetUserProfile } from "../Users/get-user-profile";
import { Getworkcpaces } from "../Workspaces/getworkcpaces";

export interface GetOrganizationOverview {
    id: string;
    name: string;
    members: GetUserProfile[];
    workspaces: Getworkcpaces[];
    totalTasks: number;
    totalCompletedTasks: number;
    totalToDoTasks: number;
    totalInProgressTasks: number;
}
