export type UserType = "admin" | "teacher" | "student" | "librarian" | "guardian" | "user";

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
        role?: 'admin' | 'user' | 'trainer';
      };
    }
  }
}
