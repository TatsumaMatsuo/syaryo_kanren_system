import {
  getBaseRecords,
  createBaseRecord,
  updateBaseRecord,
} from "@/lib/lark-client";
import { LARK_TABLES, SYSTEM_SETTINGS_FIELDS } from "@/lib/lark-tables";

export interface SystemSettings {
  license_expiry_warning_days: number;
  vehicle_expiry_warning_days: number;
  insurance_expiry_warning_days: number;
  admin_notification_after_days: number;
}

const DEFAULT_SETTINGS: SystemSettings = {
  license_expiry_warning_days: 30,
  vehicle_expiry_warning_days: 30,
  insurance_expiry_warning_days: 30,
  admin_notification_after_days: 7,
};

/**
 * システム設定を取得
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const response = await getBaseRecords(LARK_TABLES.SYSTEM_SETTINGS);

    if (!response.data?.items) {
      return DEFAULT_SETTINGS;
    }

    const settings: SystemSettings = { ...DEFAULT_SETTINGS };

    response.data.items.forEach((item: any) => {
      const key = item.fields[SYSTEM_SETTINGS_FIELDS.setting_key];
      const value = item.fields[SYSTEM_SETTINGS_FIELDS.setting_value];

      if (key && value) {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
          (settings as any)[key] = numValue;
        }
      }
    });

    return settings;
  } catch (error) {
    console.error("Failed to get system settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * システム設定を更新
 */
export async function updateSystemSettings(
  settings: SystemSettings,
  updatedBy: string
): Promise<void> {
  try {
    const now = Date.now();

    // 既存の設定を取得
    const response = await getBaseRecords(LARK_TABLES.SYSTEM_SETTINGS);
    const existingSettings = new Map<string, string>();

    if (response.data?.items) {
      response.data.items.forEach((item: any) => {
        const key = item.fields[SYSTEM_SETTINGS_FIELDS.setting_key];
        if (key) {
          existingSettings.set(key, item.record_id);
        }
      });
    }

    // 各設定を更新または作成
    for (const [key, value] of Object.entries(settings)) {
      const recordId = existingSettings.get(key);

      if (recordId) {
        // 更新
        await updateBaseRecord(LARK_TABLES.SYSTEM_SETTINGS, recordId, {
          [SYSTEM_SETTINGS_FIELDS.setting_value]: String(value),
          [SYSTEM_SETTINGS_FIELDS.updated_at]: now,
          [SYSTEM_SETTINGS_FIELDS.updated_by]: updatedBy,
        });
      } else {
        // 新規作成
        await createBaseRecord(LARK_TABLES.SYSTEM_SETTINGS, {
          [SYSTEM_SETTINGS_FIELDS.setting_key]: key,
          [SYSTEM_SETTINGS_FIELDS.setting_value]: String(value),
          [SYSTEM_SETTINGS_FIELDS.updated_at]: now,
          [SYSTEM_SETTINGS_FIELDS.updated_by]: updatedBy,
        });
      }
    }
  } catch (error) {
    console.error("Failed to update system settings:", error);
    throw error;
  }
}
