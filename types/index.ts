// 基本型定義

export type Status = "temporary" | "approved";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type UserRole = "applicant" | "admin";
export type EmploymentStatus = "active" | "resigned";
export type PermissionRole = "admin" | "viewer";
export type NotificationType =
  | "expiration_warning"
  | "expiration_alert"
  | "approval"
  | "rejection";
export type NotificationStatus = "sent" | "failed";

// 社員型
export interface Employee {
  employee_id: string;
  employee_name: string;
  email: string;
  department?: string;
  role: UserRole;
  employment_status: EmploymentStatus;
  hire_date: Date;
  resignation_date?: Date;
  created_at: Date;
  updated_at: Date;
}

// 免許証型
export interface DriversLicense {
  id: string;
  employee_id: string;
  license_number: string;
  license_type: string;
  issue_date: Date;
  expiration_date: Date;
  image_url: string;
  status: Status;
  approval_status: ApprovalStatus;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
  deleted_flag: boolean;
  deleted_at?: Date;
}

// 車検証型
export interface VehicleRegistration {
  id: string;
  employee_id: string;
  vehicle_number: string;
  vehicle_type: string;
  manufacturer: string;
  model_name: string;
  inspection_expiration_date: Date;
  owner_name: string;
  image_url: string;
  status: Status;
  approval_status: ApprovalStatus;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
  deleted_flag: boolean;
  deleted_at?: Date;
}

// 任意保険証型
export interface InsurancePolicy {
  id: string;
  employee_id: string;
  policy_number: string;
  insurance_company: string;
  policy_type: string;
  coverage_start_date: Date;
  coverage_end_date: Date;
  insured_amount?: number;
  image_url: string;
  status: Status;
  approval_status: ApprovalStatus;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
  deleted_flag: boolean;
  deleted_at?: Date;
}

// 統合ビュー型（管理者画面用）
// 1:多対応: vehicles, insurances は配列
export interface ApplicationOverview {
  employee: Employee;
  license: DriversLicense | null;
  vehicles: VehicleRegistration[];
  insurances: InsurancePolicy[];
}

// 通知履歴型
export interface NotificationHistory {
  id: string;
  recipient_id: string;
  notification_type: NotificationType;
  document_type?: "license" | "vehicle" | "insurance";
  document_id?: string;
  title: string;
  message: string;
  sent_at: Date;
  status: NotificationStatus;
  created_at: Date;
}

// ユーザー権限型
export interface UserPermission {
  id: string;
  lark_user_id: string;
  user_name: string;
  user_email: string;
  role: PermissionRole;
  granted_by: string;
  granted_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Larkユーザー型
export interface LarkUser {
  open_id: string;
  union_id?: string;
  user_id?: string;
  name: string;
  en_name?: string;
  email: string;
  mobile?: string;
  avatar?: {
    avatar_72?: string;
    avatar_240?: string;
    avatar_640?: string;
    avatar_origin?: string;
  };
  department_ids?: string[];
}
