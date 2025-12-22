import { z } from "zod";

// 免許証申請フォームのバリデーションスキーマ
export const driversLicenseSchema = z.object({
  license_number: z
    .string()
    .min(1, "免許証番号を入力してください")
    .max(50, "免許証番号は50文字以内で入力してください"),
  license_type: z
    .string()
    .min(1, "免許種類を選択してください"),
  issue_date: z
    .date({
      message: "発行日を選択してください",
    }),
  expiration_date: z
    .date({
      message: "有効期限を選択してください",
    }),
  image_file: z
    .instanceof(File, { message: "免許証の画像をアップロードしてください" })
    .optional()
    .nullable(),
});

export type DriversLicenseFormData = z.infer<typeof driversLicenseSchema>;

// 車検証申請フォームのバリデーションスキーマ
export const vehicleRegistrationSchema = z.object({
  vehicle_number: z
    .string()
    .min(1, "車両番号を入力してください")
    .max(20, "車両番号は20文字以内で入力してください"),
  vehicle_type: z
    .string()
    .min(1, "車種を入力してください"),
  manufacturer: z
    .string()
    .min(1, "メーカーを入力してください"),
  model_name: z
    .string()
    .min(1, "車名を入力してください"),
  inspection_expiration_date: z
    .date({
      message: "車検有効期限を選択してください",
    }),
  owner_name: z
    .string()
    .min(1, "所有者名を入力してください"),
  image_file: z
    .instanceof(File, { message: "車検証の画像をアップロードしてください" })
    .optional()
    .nullable(),
});

export type VehicleRegistrationFormData = z.infer<typeof vehicleRegistrationSchema>;

// 任意保険証申請フォームのバリデーションスキーマ
export const insurancePolicySchema = z.object({
  policy_number: z
    .string()
    .min(1, "保険証券番号を入力してください")
    .max(50, "保険証券番号は50文字以内で入力してください"),
  insurance_company: z
    .string()
    .min(1, "保険会社名を入力してください"),
  policy_type: z
    .string()
    .min(1, "保険種類を入力してください"),
  coverage_start_date: z
    .date({
      message: "補償開始日を選択してください",
    }),
  coverage_end_date: z
    .date({
      message: "補償終了日を選択してください",
    }),
  insured_amount: z
    .number({
      message: "補償金額は数値で入力してください",
    })
    .optional()
    .nullable(),
  image_file: z
    .instanceof(File, { message: "任意保険証の画像をアップロードしてください" })
    .optional()
    .nullable(),
});

export type InsurancePolicyFormData = z.infer<typeof insurancePolicySchema>;
