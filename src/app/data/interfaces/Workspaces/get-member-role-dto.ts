import { Role } from "../role";

export interface GetMemberRoleDto {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: Role;
}
