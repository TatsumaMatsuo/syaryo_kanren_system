// 基本型定義

export type Status = "temporary" | "approved";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type UserRole = "applicant" | "admin";
export type EmploymentStatus = "active" | "resigned";

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
export interface ApplicationOverview {
  employee: Employee;
  license: DriversLicense;
  vehicle: VehicleRegistration;
  insurance: InsurancePolicy;
}

// 通知型
export interface Notification {
  id: string;
  recipient_id: string;
  type: "approval" | "rejection" | "expiration_warning" | "expiration_alert";
  title: string;
  message: string;
  sent_at: Date;
  read: boolean;
}
