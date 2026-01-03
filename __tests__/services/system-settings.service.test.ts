import { describe, it, expect, vi, beforeEach } from "vitest";
import { SYSTEM_SETTINGS_FIELDS } from "@/lib/lark-tables";

// Lark clientをモック
vi.mock("@/lib/lark-client", () => ({
  getBaseRecords: vi.fn(),
  createBaseRecord: vi.fn(),
  updateBaseRecord: vi.fn(),
}));

import {
  getSystemSettings,
  getCompanyInfo,
  getFileStorageSettings,
  updateSystemSettings,
} from "@/services/system-settings.service";
import {
  getBaseRecords,
  createBaseRecord,
  updateBaseRecord,
} from "@/lib/lark-client";

describe("system-settings.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSystemSettings", () => {
    it("システム設定を取得する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [SYSTEM_SETTINGS_FIELDS.setting_key]: "license_expiry_warning_days",
                [SYSTEM_SETTINGS_FIELDS.setting_value]: "14",
              },
            },
            {
              record_id: "rec2",
              fields: {
                [SYSTEM_SETTINGS_FIELDS.setting_key]: "company_name",
                [SYSTEM_SETTINGS_FIELDS.setting_value]: "株式会社テスト",
              },
            },
            {
              record_id: "rec3",
              fields: {
                [SYSTEM_SETTINGS_FIELDS.setting_key]: "file_storage_type",
                [SYSTEM_SETTINGS_FIELDS.setting_value]: "box",
              },
            },
          ],
        },
      } as any);

      const result = await getSystemSettings();

      expect(result.license_expiry_warning_days).toBe(14);
      expect(result.company_name).toBe("株式会社テスト");
      expect(result.file_storage_type).toBe("box");
    });

    it("データがない場合はデフォルト値を返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getSystemSettings();

      expect(result.license_expiry_warning_days).toBe(30);
      expect(result.vehicle_expiry_warning_days).toBe(30);
      expect(result.insurance_expiry_warning_days).toBe(30);
      expect(result.company_name).toBe("");
      expect(result.file_storage_type).toBe("lark");
    });

    it("エラー時はデフォルト値を返す", async () => {
      vi.mocked(getBaseRecords).mockRejectedValue(new Error("API Error"));

      const result = await getSystemSettings();

      expect(result.license_expiry_warning_days).toBe(30);
      expect(result.file_storage_type).toBe("lark");
    });

    it("数値設定が文字列で来ても数値に変換する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [SYSTEM_SETTINGS_FIELDS.setting_key]: "admin_notification_after_days",
                [SYSTEM_SETTINGS_FIELDS.setting_value]: "3",
              },
            },
          ],
        },
      } as any);

      const result = await getSystemSettings();

      expect(result.admin_notification_after_days).toBe(3);
      expect(typeof result.admin_notification_after_days).toBe("number");
    });

    it("不正な数値は無視してデフォルト値を使用する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [SYSTEM_SETTINGS_FIELDS.setting_key]: "license_expiry_warning_days",
                [SYSTEM_SETTINGS_FIELDS.setting_value]: "invalid",
              },
            },
          ],
        },
      } as any);

      const result = await getSystemSettings();

      expect(result.license_expiry_warning_days).toBe(30); // デフォルト値
    });
  });

  describe("getCompanyInfo", () => {
    it("会社情報を取得する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [SYSTEM_SETTINGS_FIELDS.setting_key]: "company_name",
                [SYSTEM_SETTINGS_FIELDS.setting_value]: "株式会社テスト",
              },
            },
            {
              record_id: "rec2",
              fields: {
                [SYSTEM_SETTINGS_FIELDS.setting_key]: "company_postal_code",
                [SYSTEM_SETTINGS_FIELDS.setting_value]: "100-0001",
              },
            },
            {
              record_id: "rec3",
              fields: {
                [SYSTEM_SETTINGS_FIELDS.setting_key]: "company_address",
                [SYSTEM_SETTINGS_FIELDS.setting_value]: "東京都千代田区1-1-1",
              },
            },
            {
              record_id: "rec4",
              fields: {
                [SYSTEM_SETTINGS_FIELDS.setting_key]: "issuing_department",
                [SYSTEM_SETTINGS_FIELDS.setting_value]: "総務部",
              },
            },
          ],
        },
      } as any);

      const result = await getCompanyInfo();

      expect(result.company_name).toBe("株式会社テスト");
      expect(result.company_postal_code).toBe("100-0001");
      expect(result.company_address).toBe("東京都千代田区1-1-1");
      expect(result.issuing_department).toBe("総務部");
    });
  });

  describe("getFileStorageSettings", () => {
    it("ファイルストレージ設定を取得する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [SYSTEM_SETTINGS_FIELDS.setting_key]: "file_storage_type",
                [SYSTEM_SETTINGS_FIELDS.setting_value]: "box",
              },
            },
            {
              record_id: "rec2",
              fields: {
                [SYSTEM_SETTINGS_FIELDS.setting_key]: "box_folder_id",
                [SYSTEM_SETTINGS_FIELDS.setting_value]: "folder123",
              },
            },
          ],
        },
      } as any);

      const result = await getFileStorageSettings();

      expect(result.storage_type).toBe("box");
      expect(result.box_folder_id).toBe("folder123");
    });

    it("デフォルトはlarkストレージ", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getFileStorageSettings();

      expect(result.storage_type).toBe("lark");
    });
  });

  describe("updateSystemSettings", () => {
    it("既存の設定を更新する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [SYSTEM_SETTINGS_FIELDS.setting_key]: "license_expiry_warning_days",
                [SYSTEM_SETTINGS_FIELDS.setting_value]: "30",
              },
            },
          ],
        },
      } as any);
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await updateSystemSettings(
        { license_expiry_warning_days: 14 },
        "admin@example.com"
      );

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [SYSTEM_SETTINGS_FIELDS.setting_value]: "14",
          [SYSTEM_SETTINGS_FIELDS.updated_by]: "admin@example.com",
        })
      );
    });

    it("新規設定を作成する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);
      vi.mocked(createBaseRecord).mockResolvedValue({} as any);

      await updateSystemSettings(
        { company_name: "新会社" },
        "admin@example.com"
      );

      expect(createBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          [SYSTEM_SETTINGS_FIELDS.setting_key]: "company_name",
          [SYSTEM_SETTINGS_FIELDS.setting_value]: "新会社",
          [SYSTEM_SETTINGS_FIELDS.updated_by]: "admin@example.com",
        })
      );
    });

    it("複数の設定を更新する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [SYSTEM_SETTINGS_FIELDS.setting_key]: "company_name",
                [SYSTEM_SETTINGS_FIELDS.setting_value]: "旧会社",
              },
            },
          ],
        },
      } as any);
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);
      vi.mocked(createBaseRecord).mockResolvedValue({} as any);

      await updateSystemSettings(
        {
          company_name: "新会社",
          company_address: "新住所",
        },
        "admin@example.com"
      );

      expect(updateBaseRecord).toHaveBeenCalled();
      expect(createBaseRecord).toHaveBeenCalled();
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(getBaseRecords).mockRejectedValue(new Error("API Error"));

      await expect(
        updateSystemSettings({ company_name: "テスト" }, "admin@example.com")
      ).rejects.toThrow("API Error");
    });
  });
});
