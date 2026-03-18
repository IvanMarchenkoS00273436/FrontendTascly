import { Role } from "../role";

export interface GetMemberRoleDto {
    memberId: string;
    userName: string;
    firstName: string;
    lastName: string;
    role: Role;
}
