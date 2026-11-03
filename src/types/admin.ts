export type UserRoleType = "STUDENT" | "ADVISOR";
export type AccountStatusType = "ACTIVE" | "BLOCKED";

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRoleType;
  status: AccountStatusType;
  mustChangePassword: boolean;
  createdAt: string;
  // Hồ sơ Sinh viên (Bảng student_profiles)
  majorName?: string;
  educationSystemName?: string;
  cohortName?: string;
  // Hồ sơ Tư vấn viên (Bảng advisor_profiles)
  departmentName?: string;
  phoneNumber?: string;
  note?: string;
}

export type CategoryTabKey =
  | "MAJOR"
  | "EDUCATION_SYSTEM"
  | "COHORT"
  | "DEPARTMENT";

export type CategoryStatus = "ACTIVE" | "INACTIVE";

export interface CategoryItem {
  id: string;
  categoryType: CategoryTabKey;
  name: string;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PendingRequestSummary {
  id: string;
  type: "ADD" | "UPDATE" | "DELETE";
  title: string;
  advisor: string;
  department: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: number;
  actor: string;
  action: string;
  target: string;
  time: string;
}

