import { describe, it, expect, vi, beforeEach } from "vitest";
import { VEHICLE_REGISTRATION_FIELDS } from "@/lib/lark-tables";

// Lark clientをモック
vi.mock("@/lib/lark-client", () => ({
  getBaseRecords: vi.fn(),
  createBaseRecord: vi.fn(),
  updateBaseRecord: vi.fn(),
  deleteBaseRecord: vi.fn(),
}));

import {
  getVehicleRegistrations,
  createVehicleRegistration,
  updateVehicleRegistration,
  deleteVehicleRegistration,
  approveVehicleRegistration,
  rejectVehicleRegistration,
  getExpiringVehicleRegistrations,
  getExpiredVehicleRegistrations,
} from "@/services/vehicle-registration.service";
import {
  getBaseRecords,
  createBaseRecord,
  updateBaseRecord,
  deleteBaseRecord,
} from "@/lib/lark-client";

describe("vehicle-registration.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVehicleRegistrations", () => {
    it("車検証一覧を取得する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [VEHICLE_REGISTRATION_FIELDS.employee_id]: "emp001",
                [VEHICLE_REGISTRATION_FIELDS.vehicle_number]: "品川500あ1234",
                [VEHICLE_REGISTRATION_FIELDS.vehicle_type]: "普通",
                [VEHICLE_REGISTRATION_FIELDS.manufacturer]: "トヨタ",
                [VEHICLE_REGISTRATION_FIELDS.model_name]: "プリウス",
                [VEHICLE_REGISTRATION_FIELDS.expiration_date]: now + 86400000 * 365,
                [VEHICLE_REGISTRATION_FIELDS.owner_name]: "山田太郎",
                [VEHICLE_REGISTRATION_FIELDS.status]: "pending",
                [VEHICLE_REGISTRATION_FIELDS.approval_status]: "pending",
                [VEHICLE_REGISTRATION_FIELDS.deleted_flag]: false,
                [VEHICLE_REGISTRATION_FIELDS.registration_date]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getVehicleRegistrations();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("rec1");
      expect(result[0].employee_id).toBe("emp001");
      expect(result[0].vehicle_number).toBe("品川500あ1234");
    });

    it("特定社員の車検証を取得する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [VEHICLE_REGISTRATION_FIELDS.employee_id]: "emp001",
                [VEHICLE_REGISTRATION_FIELDS.vehicle_number]: "品川500あ1234",
                [VEHICLE_REGISTRATION_FIELDS.expiration_date]: now + 86400000 * 365,
                [VEHICLE_REGISTRATION_FIELDS.deleted_flag]: false,
                [VEHICLE_REGISTRATION_FIELDS.registration_date]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getVehicleRegistrations("emp001");

      expect(result).toHaveLength(1);
      expect(getBaseRecords).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filter: 'CurrentValue.[employee_id]="emp001"',
        })
      );
    });

    it("削除済みの車検証は除外する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [VEHICLE_REGISTRATION_FIELDS.employee_id]: "emp001",
                [VEHICLE_REGISTRATION_FIELDS.vehicle_number]: "品川500あ1234",
                [VEHICLE_REGISTRATION_FIELDS.deleted_flag]: true,
              },
            },
            {
              record_id: "rec2",
              fields: {
                [VEHICLE_REGISTRATION_FIELDS.employee_id]: "emp002",
                [VEHICLE_REGISTRATION_FIELDS.vehicle_number]: "横浜300い5678",
                [VEHICLE_REGISTRATION_FIELDS.deleted_flag]: false,
                [VEHICLE_REGISTRATION_FIELDS.registration_date]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getVehicleRegistrations();

      expect(result).toHaveLength(1);
      expect(result[0].employee_id).toBe("emp002");
    });

    it("データがない場合は空配列を返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getVehicleRegistrations();

      expect(result).toEqual([]);
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(getBaseRecords).mockRejectedValue(new Error("API Error"));

      await expect(getVehicleRegistrations()).rejects.toThrow("API Error");
    });
  });

  describe("createVehicleRegistration", () => {
    it("車検証を新規作成する", async () => {
      vi.mocked(createBaseRecord).mockResolvedValue({
        data: {
          record: {
            record_id: "new_rec",
          },
        },
      } as any);

      const data = {
        employee_id: "emp001",
        vehicle_number: "品川500あ1234",
        vehicle_type: "普通" as const,
        manufacturer: "トヨタ",
        model_name: "プリウス",
        inspection_expiration_date: new Date("2027-01-01"),
        owner_name: "山田太郎",
        image_url: "https://example.com/image.jpg",
        status: "pending" as const,
        approval_status: "pending" as const,
        deleted_flag: false,
      };

      const result = await createVehicleRegistration(data);

      expect(result.id).toBe("new_rec");
      expect(result.employee_id).toBe("emp001");
      expect(createBaseRecord).toHaveBeenCalled();
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(createBaseRecord).mockRejectedValue(new Error("Create Error"));

      const data = {
        employee_id: "emp001",
        vehicle_number: "品川500あ1234",
        inspection_expiration_date: new Date("2027-01-01"),
        status: "pending" as const,
        approval_status: "pending" as const,
        deleted_flag: false,
      };

      await expect(createVehicleRegistration(data)).rejects.toThrow("Create Error");
    });
  });

  describe("updateVehicleRegistration", () => {
    it("車検証を更新する", async () => {
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await updateVehicleRegistration("rec1", {
        vehicle_number: "新宿100う9999",
        status: "approved",
      });

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [VEHICLE_REGISTRATION_FIELDS.vehicle_number]: "新宿100う9999",
          [VEHICLE_REGISTRATION_FIELDS.status]: "approved",
        })
      );
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(updateBaseRecord).mockRejectedValue(new Error("Update Error"));

      await expect(
        updateVehicleRegistration("rec1", { status: "approved" })
      ).rejects.toThrow("Update Error");
    });
  });

  describe("deleteVehicleRegistration", () => {
    it("車検証を削除する", async () => {
      vi.mocked(deleteBaseRecord).mockResolvedValue({} as any);

      await deleteVehicleRegistration("rec1");

      expect(deleteBaseRecord).toHaveBeenCalledWith(expect.any(String), "rec1");
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(deleteBaseRecord).mockRejectedValue(new Error("Delete Error"));

      await expect(deleteVehicleRegistration("rec1")).rejects.toThrow("Delete Error");
    });
  });

  describe("approveVehicleRegistration", () => {
    it("車検証を承認する", async () => {
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await approveVehicleRegistration("rec1");

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [VEHICLE_REGISTRATION_FIELDS.status]: "approved",
          [VEHICLE_REGISTRATION_FIELDS.approval_status]: "approved",
        })
      );
    });
  });

  describe("rejectVehicleRegistration", () => {
    it("車検証を却下する", async () => {
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await rejectVehicleRegistration("rec1", "車検が切れています");

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [VEHICLE_REGISTRATION_FIELDS.approval_status]: "rejected",
          [VEHICLE_REGISTRATION_FIELDS.rejection_reason]: "車検が切れています",
        })
      );
    });
  });

  describe("getExpiringVehicleRegistrations", () => {
    it("期限切れ間近の車検証を取得する", async () => {
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
                [VEHICLE_REGISTRATION_FIELDS.employee_id]: "emp001",
                [VEHICLE_REGISTRATION_FIELDS.vehicle_number]: "品川500あ1234",
                [VEHICLE_REGISTRATION_FIELDS.expiration_date]: expiringDate.getTime(),
                [VEHICLE_REGISTRATION_FIELDS.status]: "approved",
                [VEHICLE_REGISTRATION_FIELDS.approval_status]: "approved",
                [VEHICLE_REGISTRATION_FIELDS.deleted_flag]: false,
                [VEHICLE_REGISTRATION_FIELDS.created_at]: Date.now(),
                [VEHICLE_REGISTRATION_FIELDS.updated_at]: Date.now(),
              },
            },
          ],
        },
      } as any);

      const result = await getExpiringVehicleRegistrations(30);

      expect(result).toHaveLength(1);
      expect(result[0].employee_id).toBe("emp001");
    });

    it("承認されていない車検証は除外する", async () => {
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
                [VEHICLE_REGISTRATION_FIELDS.employee_id]: "emp001",
                [VEHICLE_REGISTRATION_FIELDS.expiration_date]: expiringDate.getTime(),
                [VEHICLE_REGISTRATION_FIELDS.status]: "pending",
                [VEHICLE_REGISTRATION_FIELDS.approval_status]: "pending",
                [VEHICLE_REGISTRATION_FIELDS.deleted_flag]: false,
              },
            },
          ],
        },
      } as any);

      const result = await getExpiringVehicleRegistrations(30);

      expect(result).toHaveLength(0);
    });
  });

  describe("getExpiredVehicleRegistrations", () => {
    it("期限切れの車検証を取得する", async () => {
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
                [VEHICLE_REGISTRATION_FIELDS.employee_id]: "emp001",
                [VEHICLE_REGISTRATION_FIELDS.vehicle_number]: "品川500あ1234",
                [VEHICLE_REGISTRATION_FIELDS.expiration_date]: expiredDate.getTime(),
                [VEHICLE_REGISTRATION_FIELDS.status]: "approved",
                [VEHICLE_REGISTRATION_FIELDS.approval_status]: "approved",
                [VEHICLE_REGISTRATION_FIELDS.deleted_flag]: false,
                [VEHICLE_REGISTRATION_FIELDS.created_at]: Date.now(),
                [VEHICLE_REGISTRATION_FIELDS.updated_at]: Date.now(),
              },
            },
          ],
        },
      } as any);

      const result = await getExpiredVehicleRegistrations();

      expect(result).toHaveLength(1);
      expect(result[0].employee_id).toBe("emp001");
    });

    it("削除済みの車検証は除外する", async () => {
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
                [VEHICLE_REGISTRATION_FIELDS.employee_id]: "emp001",
                [VEHICLE_REGISTRATION_FIELDS.expiration_date]: expiredDate.getTime(),
                [VEHICLE_REGISTRATION_FIELDS.status]: "approved",
                [VEHICLE_REGISTRATION_FIELDS.approval_status]: "approved",
                [VEHICLE_REGISTRATION_FIELDS.deleted_flag]: true,
              },
            },
          ],
        },
      } as any);

      const result = await getExpiredVehicleRegistrations();

      expect(result).toHaveLength(0);
    });
  });
});
