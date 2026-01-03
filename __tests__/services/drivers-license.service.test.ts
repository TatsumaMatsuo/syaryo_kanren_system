import { describe, it, expect, vi, beforeEach } from "vitest";
import { DRIVERS_LICENSE_FIELDS } from "@/lib/lark-tables";

// Lark clientをモック
vi.mock("@/lib/lark-client", () => ({
  getBaseRecords: vi.fn(),
  createBaseRecord: vi.fn(),
  updateBaseRecord: vi.fn(),
  deleteBaseRecord: vi.fn(),
}));

import {
  getDriversLicenses,
  createDriversLicense,
  updateDriversLicense,
  deleteDriversLicense,
  approveDriversLicense,
  rejectDriversLicense,
  getExpiringDriversLicenses,
  getExpiredDriversLicenses,
} from "@/services/drivers-license.service";
import {
  getBaseRecords,
  createBaseRecord,
  updateBaseRecord,
  deleteBaseRecord,
} from "@/lib/lark-client";

describe("drivers-license.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDriversLicenses", () => {
    it("免許証一覧を取得する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [DRIVERS_LICENSE_FIELDS.employee_id]: "emp001",
                [DRIVERS_LICENSE_FIELDS.license_number]: "123456789012",
                [DRIVERS_LICENSE_FIELDS.license_type]: "普通",
                [DRIVERS_LICENSE_FIELDS.issue_date]: now,
                [DRIVERS_LICENSE_FIELDS.expiration_date]: now + 86400000 * 365,
                [DRIVERS_LICENSE_FIELDS.image_url]: "https://example.com/image.jpg",
                [DRIVERS_LICENSE_FIELDS.status]: "pending",
                [DRIVERS_LICENSE_FIELDS.approval_status]: "pending",
                [DRIVERS_LICENSE_FIELDS.deleted_flag]: false,
                [DRIVERS_LICENSE_FIELDS.created_at]: now,
                [DRIVERS_LICENSE_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getDriversLicenses();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("rec1");
      expect(result[0].employee_id).toBe("emp001");
      expect(result[0].license_number).toBe("123456789012");
    });

    it("特定社員の免許証を取得する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [DRIVERS_LICENSE_FIELDS.employee_id]: "emp001",
                [DRIVERS_LICENSE_FIELDS.license_number]: "123456789012",
                [DRIVERS_LICENSE_FIELDS.license_type]: "普通",
                [DRIVERS_LICENSE_FIELDS.issue_date]: now,
                [DRIVERS_LICENSE_FIELDS.expiration_date]: now + 86400000 * 365,
                [DRIVERS_LICENSE_FIELDS.status]: "pending",
                [DRIVERS_LICENSE_FIELDS.approval_status]: "pending",
                [DRIVERS_LICENSE_FIELDS.deleted_flag]: false,
                [DRIVERS_LICENSE_FIELDS.created_at]: now,
                [DRIVERS_LICENSE_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getDriversLicenses("emp001");

      expect(result).toHaveLength(1);
      expect(getBaseRecords).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filter: 'CurrentValue.[employee_id]="emp001"',
        })
      );
    });

    it("削除済みの免許証は除外する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [DRIVERS_LICENSE_FIELDS.employee_id]: "emp001",
                [DRIVERS_LICENSE_FIELDS.license_number]: "123456789012",
                [DRIVERS_LICENSE_FIELDS.deleted_flag]: true,
                [DRIVERS_LICENSE_FIELDS.created_at]: now,
                [DRIVERS_LICENSE_FIELDS.updated_at]: now,
              },
            },
            {
              record_id: "rec2",
              fields: {
                [DRIVERS_LICENSE_FIELDS.employee_id]: "emp002",
                [DRIVERS_LICENSE_FIELDS.license_number]: "987654321098",
                [DRIVERS_LICENSE_FIELDS.deleted_flag]: false,
                [DRIVERS_LICENSE_FIELDS.created_at]: now,
                [DRIVERS_LICENSE_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getDriversLicenses();

      expect(result).toHaveLength(1);
      expect(result[0].employee_id).toBe("emp002");
    });

    it("データがない場合は空配列を返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getDriversLicenses();

      expect(result).toEqual([]);
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(getBaseRecords).mockRejectedValue(new Error("API Error"));

      await expect(getDriversLicenses()).rejects.toThrow("API Error");
    });
  });

  describe("createDriversLicense", () => {
    it("免許証を新規作成する", async () => {
      vi.mocked(createBaseRecord).mockResolvedValue({
        data: {
          record: {
            record_id: "new_rec",
          },
        },
      } as any);

      const data = {
        employee_id: "emp001",
        license_number: "123456789012",
        license_type: "普通" as const,
        issue_date: new Date("2024-01-01"),
        expiration_date: new Date("2027-01-01"),
        image_url: "https://example.com/image.jpg",
        status: "pending" as const,
        approval_status: "pending" as const,
        deleted_flag: false,
      };

      const result = await createDriversLicense(data);

      expect(result.id).toBe("new_rec");
      expect(result.employee_id).toBe("emp001");
      expect(createBaseRecord).toHaveBeenCalled();
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(createBaseRecord).mockRejectedValue(new Error("Create Error"));

      const data = {
        employee_id: "emp001",
        license_number: "123456789012",
        license_type: "普通" as const,
        issue_date: new Date("2024-01-01"),
        expiration_date: new Date("2027-01-01"),
        status: "pending" as const,
        approval_status: "pending" as const,
        deleted_flag: false,
      };

      await expect(createDriversLicense(data)).rejects.toThrow("Create Error");
    });
  });

  describe("updateDriversLicense", () => {
    it("免許証を更新する", async () => {
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await updateDriversLicense("rec1", {
        license_number: "999999999999",
        status: "approved",
      });

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [DRIVERS_LICENSE_FIELDS.license_number]: "999999999999",
          [DRIVERS_LICENSE_FIELDS.status]: "approved",
        })
      );
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(updateBaseRecord).mockRejectedValue(new Error("Update Error"));

      await expect(
        updateDriversLicense("rec1", { status: "approved" })
      ).rejects.toThrow("Update Error");
    });
  });

  describe("deleteDriversLicense", () => {
    it("免許証を削除する", async () => {
      vi.mocked(deleteBaseRecord).mockResolvedValue({} as any);

      await deleteDriversLicense("rec1");

      expect(deleteBaseRecord).toHaveBeenCalledWith(expect.any(String), "rec1");
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(deleteBaseRecord).mockRejectedValue(new Error("Delete Error"));

      await expect(deleteDriversLicense("rec1")).rejects.toThrow("Delete Error");
    });
  });

  describe("approveDriversLicense", () => {
    it("免許証を承認する", async () => {
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await approveDriversLicense("rec1");

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [DRIVERS_LICENSE_FIELDS.status]: "approved",
          [DRIVERS_LICENSE_FIELDS.approval_status]: "approved",
        })
      );
    });
  });

  describe("rejectDriversLicense", () => {
    it("免許証を却下する", async () => {
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await rejectDriversLicense("rec1", "画像が不鮮明です");

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [DRIVERS_LICENSE_FIELDS.approval_status]: "rejected",
          [DRIVERS_LICENSE_FIELDS.rejection_reason]: "画像が不鮮明です",
        })
      );
    });
  });

  describe("getExpiringDriversLicenses", () => {
    it("期限切れ間近の免許証を取得する", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // 7日後に期限切れ
      const expiringDate = new Date(today);
      expiringDate.setDate(expiringDate.getDate() + 7);

      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [DRIVERS_LICENSE_FIELDS.employee_id]: "emp001",
                [DRIVERS_LICENSE_FIELDS.license_number]: "123456789012",
                [DRIVERS_LICENSE_FIELDS.license_type]: "普通",
                [DRIVERS_LICENSE_FIELDS.issue_date]: Date.now(),
                [DRIVERS_LICENSE_FIELDS.expiration_date]: expiringDate.getTime(),
                [DRIVERS_LICENSE_FIELDS.status]: "approved",
                [DRIVERS_LICENSE_FIELDS.approval_status]: "approved",
                [DRIVERS_LICENSE_FIELDS.deleted_flag]: false,
                [DRIVERS_LICENSE_FIELDS.created_at]: Date.now(),
                [DRIVERS_LICENSE_FIELDS.updated_at]: Date.now(),
              },
            },
          ],
        },
      } as any);

      const result = await getExpiringDriversLicenses(30);

      expect(result).toHaveLength(1);
      expect(result[0].employee_id).toBe("emp001");
    });

    it("承認されていない免許証は除外する", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiringDate = new Date(today);
      expiringDate.setDate(expiringDate.getDate() + 7);

      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [DRIVERS_LICENSE_FIELDS.employee_id]: "emp001",
                [DRIVERS_LICENSE_FIELDS.expiration_date]: expiringDate.getTime(),
                [DRIVERS_LICENSE_FIELDS.status]: "pending",
                [DRIVERS_LICENSE_FIELDS.approval_status]: "pending",
                [DRIVERS_LICENSE_FIELDS.deleted_flag]: false,
              },
            },
          ],
        },
      } as any);

      const result = await getExpiringDriversLicenses(30);

      expect(result).toHaveLength(0);
    });
  });

  describe("getExpiredDriversLicenses", () => {
    it("期限切れの免許証を取得する", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // 7日前に期限切れ
      const expiredDate = new Date(today);
      expiredDate.setDate(expiredDate.getDate() - 7);

      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [DRIVERS_LICENSE_FIELDS.employee_id]: "emp001",
                [DRIVERS_LICENSE_FIELDS.license_number]: "123456789012",
                [DRIVERS_LICENSE_FIELDS.license_type]: "普通",
                [DRIVERS_LICENSE_FIELDS.issue_date]: Date.now(),
                [DRIVERS_LICENSE_FIELDS.expiration_date]: expiredDate.getTime(),
                [DRIVERS_LICENSE_FIELDS.status]: "approved",
                [DRIVERS_LICENSE_FIELDS.approval_status]: "approved",
                [DRIVERS_LICENSE_FIELDS.deleted_flag]: false,
                [DRIVERS_LICENSE_FIELDS.created_at]: Date.now(),
                [DRIVERS_LICENSE_FIELDS.updated_at]: Date.now(),
              },
            },
          ],
        },
      } as any);

      const result = await getExpiredDriversLicenses();

      expect(result).toHaveLength(1);
      expect(result[0].employee_id).toBe("emp001");
    });

    it("削除済みの免許証は除外する", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiredDate = new Date(today);
      expiredDate.setDate(expiredDate.getDate() - 7);

      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [DRIVERS_LICENSE_FIELDS.employee_id]: "emp001",
                [DRIVERS_LICENSE_FIELDS.expiration_date]: expiredDate.getTime(),
                [DRIVERS_LICENSE_FIELDS.status]: "approved",
                [DRIVERS_LICENSE_FIELDS.approval_status]: "approved",
                [DRIVERS_LICENSE_FIELDS.deleted_flag]: true,
              },
            },
          ],
        },
      } as any);

      const result = await getExpiredDriversLicenses();

      expect(result).toHaveLength(0);
    });
  });
});
