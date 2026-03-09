export interface GetUserProfile {
    id? : string;
    userId? : string;
    userName: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
    organizationName: string;
}
