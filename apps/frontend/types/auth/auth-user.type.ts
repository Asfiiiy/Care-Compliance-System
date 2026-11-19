export interface AuthUser {
  id: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  staff?: {
    id: string;
    employeeNo: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    avatarUrl?: string | null;
  };
}