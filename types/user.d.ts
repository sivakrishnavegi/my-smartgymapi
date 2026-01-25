export type UserType = "admin" | "superadmin" | "guest" | "teacher" | "student" | "librarian" | "guardian" | "user" | "trainer";

export interface IUser {
  _id: string
  email: string
  role: UserType
}

// types/express/index.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: UserType;
        tenantId?: string;
        schoolId?: string;
      };
    }
  }
}
