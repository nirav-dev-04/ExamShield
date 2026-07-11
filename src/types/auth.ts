export type UserRole = "STUDENT" | "PROCTOR" | "ADMIN" | "SUPER_ADMIN";

export interface UserResponseDTO {
  id: number;
  email: string;
  enrollmentNo: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}
