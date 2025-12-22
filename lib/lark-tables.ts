/**
 * Lark Base テーブルID定義
 *
 * 実際の環境では、これらのIDは環境変数から読み込むか、
 * 初期セットアップ時に動的に作成・取得する必要があります
 */

export const LARK_TABLES = {
  // 免許証テーブル
  DRIVERS_LICENSES: process.env.LARK_TABLE_DRIVERS_LICENSES || "",

  // 車検証テーブル
  VEHICLE_REGISTRATIONS: process.env.LARK_TABLE_VEHICLE_REGISTRATIONS || "",

  // 任意保険証テーブル
  INSURANCE_POLICIES: process.env.LARK_TABLE_INSURANCE_POLICIES || "",

  // 社員マスタテーブル
  EMPLOYEES: process.env.LARK_TABLE_EMPLOYEES || "",

  // ユーザー権限テーブル
  USER_PERMISSIONS: process.env.LARK_TABLE_USER_PERMISSIONS || "",

  // 通知履歴テーブル
  NOTIFICATION_HISTORY: process.env.LARK_TABLE_NOTIFICATION_HISTORY || "",
} as const;

/**
 * テーブルフィールド定義
 */

export const DRIVERS_LICENSE_FIELDS = {
  id: "id",
  employee_id: "employee_id",
  license_number: "license_number",
  license_type: "license_type",
  issue_date: "issue_date",
  expiration_date: "expiration_date",
  image_url: "image_url",
  status: "status",
  approval_status: "approval_status",
  rejection_reason: "rejection_reason",
  created_at: "created_at",
  updated_at: "updated_at",
  deleted_flag: "deleted_flag",
  deleted_at: "deleted_at",
} as const;

export const VEHICLE_REGISTRATION_FIELDS = {
  id: "id",
  employee_id: "employee_id",
  vehicle_number: "vehicle_number",
  vehicle_type: "vehicle_type",
  manufacturer: "manufacturer",
  model_name: "model_name",
  inspection_expiration_date: "inspection_expiration_date",
  owner_name: "owner_name",
  image_url: "image_url",
  status: "status",
  approval_status: "approval_status",
  rejection_reason: "rejection_reason",
  created_at: "created_at",
  updated_at: "updated_at",
  deleted_flag: "deleted_flag",
  deleted_at: "deleted_at",
} as const;

export const INSURANCE_POLICY_FIELDS = {
  id: "id",
  employee_id: "employee_id",
  policy_number: "policy_number",
  insurance_company: "insurance_company",
  policy_type: "policy_type",
  coverage_start_date: "coverage_start_date",
  coverage_end_date: "coverage_end_date",
  insured_amount: "insured_amount",
  image_url: "image_url",
  status: "status",
  approval_status: "approval_status",
  rejection_reason: "rejection_reason",
  created_at: "created_at",
  updated_at: "updated_at",
  deleted_flag: "deleted_flag",
  deleted_at: "deleted_at",
} as const;

export const EMPLOYEE_FIELDS = {
  employee_id: "employee_id",
  employee_name: "employee_name",
  email: "email",
  department: "department",
  role: "role",
  employment_status: "employment_status",
  hire_date: "hire_date",
  resignation_date: "resignation_date",
  created_at: "created_at",
  updated_at: "updated_at",
} as const;

export const USER_PERMISSION_FIELDS = {
  id: "id",
  lark_user_id: "lark_user_id",
  user_name: "user_name",
  user_email: "user_email",
  role: "role",
  granted_by: "granted_by",
  granted_at: "granted_at",
  created_at: "created_at",
  updated_at: "updated_at",
} as const;

export const NOTIFICATION_HISTORY_FIELDS = {
  id: "id",
  recipient_id: "recipient_id",
  notification_type: "notification_type",
  document_type: "document_type",
  document_id: "document_id",
  title: "title",
  message: "message",
  sent_at: "sent_at",
  status: "status",
  created_at: "created_at",
} as const;
