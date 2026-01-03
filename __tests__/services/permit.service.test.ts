import { describe, it, expect, vi, beforeEach } from "vitest";
import { PERMIT_FIELDS } from "@/lib/lark-tables";

// Lark clientをモック
vi.mock("@/lib/lark-client", () => ({
  getBaseRecords: vi.fn(),
  createBaseRecord: vi.fn(),
  updateBaseRecord: vi.fn(),
}));

// employee.serviceをモック
vi.mock("@/services/employee.service", () => ({
  getEmployee: vi.fn().mockResolvedValue(null),
}));

import {
  getPermits,
  getPermitById,
  getPermitByToken,
  createPermit,
  updatePermitStatus,
  updatePermitFileKey,
  getValidPermitByVehicleId,
  getExpiredPermits,
  revokeExistingPermit,
} from "@/services/permit.service";
import {
  getBaseRecords,
  createBaseRecord,
  updateBaseRecord,
} from "@/lib/lark-client";

describe("permit.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPermits", () => {
    it("許可証一覧を取得する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [PERMIT_FIELDS.employee_id]: "emp001",
                [PERMIT_FIELDS.employee_name]: "山田太郎",
                [PERMIT_FIELDS.vehicle_id]: "veh001",
                [PERMIT_FIELDS.vehicle_number]: "品川500あ1234",
                [PERMIT_FIELDS.vehicle_model]: "プリウス",
                [PERMIT_FIELDS.issue_date]: now,
                [PERMIT_FIELDS.expiration_date]: now + 86400000 * 365,
                [PERMIT_FIELDS.permit_file_key]: "file-key-123",
                [PERMIT_FIELDS.verification_token]: "token-abc",
                [PERMIT_FIELDS.status]: "valid",
                [PERMIT_FIELDS.created_at]: now,
                [PERMIT_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getPermits();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("rec1");
      expect(result[0].employee_id).toBe("emp001");
      expect(result[0].employee_name).toBe("山田太郎");
      expect(result[0].status).toBe("valid");
    });

    it("特定社員の許可証を取得する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [PERMIT_FIELDS.employee_id]: "emp001",
                [PERMIT_FIELDS.employee_name]: "山田太郎",
                [PERMIT_FIELDS.vehicle_id]: "veh001",
                [PERMIT_FIELDS.vehicle_number]: "品川500あ1234",
                [PERMIT_FIELDS.issue_date]: now,
                [PERMIT_FIELDS.expiration_date]: now + 86400000 * 365,
                [PERMIT_FIELDS.status]: "valid",
                [PERMIT_FIELDS.created_at]: now,
                [PERMIT_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getPermits("emp001");

      expect(result).toHaveLength(1);
      expect(getBaseRecords).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filter: 'CurrentValue.[employee_id]="emp001"',
        })
      );
    });

    it("データがない場合は空配列を返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getPermits();

      expect(result).toEqual([]);
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(getBaseRecords).mockRejectedValue(new Error("API Error"));

      await expect(getPermits()).rejects.toThrow("API Error");
    });
  });

  describe("getPermitById", () => {
    it("IDで許可証を取得する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [PERMIT_FIELDS.employee_id]: "emp001",
                [PERMIT_FIELDS.employee_name]: "山田太郎",
                [PERMIT_FIELDS.vehicle_id]: "veh001",
                [PERMIT_FIELDS.vehicle_number]: "品川500あ1234",
                [PERMIT_FIELDS.issue_date]: now,
                [PERMIT_FIELDS.expiration_date]: now + 86400000 * 365,
                [PERMIT_FIELDS.status]: "valid",
                [PERMIT_FIELDS.created_at]: now,
                [PERMIT_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getPermitById("rec1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("rec1");
    });

    it("存在しない場合はnullを返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getPermitById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getPermitByToken", () => {
    it("トークンで許可証を取得する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [PERMIT_FIELDS.employee_id]: "emp001",
                [PERMIT_FIELDS.employee_name]: "山田太郎",
                [PERMIT_FIELDS.vehicle_id]: "veh001",
                [PERMIT_FIELDS.vehicle_number]: "品川500あ1234",
                [PERMIT_FIELDS.verification_token]: "token-abc",
                [PERMIT_FIELDS.issue_date]: now,
                [PERMIT_FIELDS.expiration_date]: now + 86400000 * 365,
                [PERMIT_FIELDS.status]: "valid",
                [PERMIT_FIELDS.created_at]: now,
                [PERMIT_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getPermitByToken("token-abc");

      expect(result).not.toBeNull();
      expect(result?.verification_token).toBe("token-abc");
    });

    it("存在しない場合はnullを返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getPermitByToken("nonexistent-token");

      expect(result).toBeNull();
    });
  });

  describe("createPermit", () => {
    it("許可証を新規作成する", async () => {
      vi.mocked(createBaseRecord).mockResolvedValue({
        data: {
          record: {
            record_id: "new_rec",
          },
        },
      } as any);

      const data = {
        employee_id: "emp001",
        employee_name: "山田太郎",
        vehicle_id: "veh001",
        vehicle_number: "品川500あ1234",
        vehicle_model: "プリウス",
        expiration_date: new Date("2027-01-01"),
      };

      const result = await createPermit(data, "file-key-123");

      expect(result.id).toBe("new_rec");
      expect(result.employee_id).toBe("emp001");
      expect(result.permit_file_key).toBe("file-key-123");
      expect(result.status).toBe("valid");
      expect(result.verification_token).toBeTruthy();
      expect(createBaseRecord).toHaveBeenCalled();
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(createBaseRecord).mockRejectedValue(new Error("Create Error"));

      const data = {
        employee_id: "emp001",
        employee_name: "山田太郎",
        vehicle_id: "veh001",
        vehicle_number: "品川500あ1234",
        vehicle_model: "プリウス",
        expiration_date: new Date("2027-01-01"),
      };

      await expect(createPermit(data, "file-key-123")).rejects.toThrow("Create Error");
    });
  });

  describe("updatePermitStatus", () => {
    it("許可証のステータスを更新する", async () => {
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await updatePermitStatus("rec1", "expired");

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [PERMIT_FIELDS.status]: "expired",
        })
      );
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(updateBaseRecord).mockRejectedValue(new Error("Update Error"));

      await expect(updatePermitStatus("rec1", "expired")).rejects.toThrow("Update Error");
    });
  });

  describe("updatePermitFileKey", () => {
    it("許可証のファイルキーを更新する", async () => {
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await updatePermitFileKey("rec1", "new-file-key");

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [PERMIT_FIELDS.permit_file_key]: "new-file-key",
        })
      );
    });
  });

  describe("getValidPermitByVehicleId", () => {
    it("車両IDで有効な許可証を取得する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [PERMIT_FIELDS.employee_id]: "emp001",
                [PERMIT_FIELDS.employee_name]: "山田太郎",
                [PERMIT_FIELDS.vehicle_id]: "veh001",
                [PERMIT_FIELDS.vehicle_number]: "品川500あ1234",
                [PERMIT_FIELDS.status]: "valid",
                [PERMIT_FIELDS.issue_date]: now,
                [PERMIT_FIELDS.expiration_date]: now + 86400000 * 365,
                [PERMIT_FIELDS.created_at]: now,
                [PERMIT_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getValidPermitByVehicleId("veh001");

      expect(result).not.toBeNull();
      expect(result?.vehicle_id).toBe("veh001");
      expect(result?.status).toBe("valid");
    });

    it("存在しない場合はnullを返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getValidPermitByVehicleId("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getExpiredPermits", () => {
    it("期限切れの許可証を取得する", async () => {
      const now = Date.now();
      const expiredDate = now - 86400000; // 1日前

      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [PERMIT_FIELDS.employee_id]: "emp001",
                [PERMIT_FIELDS.employee_name]: "山田太郎",
                [PERMIT_FIELDS.vehicle_id]: "veh001",
                [PERMIT_FIELDS.vehicle_number]: "品川500あ1234",
                [PERMIT_FIELDS.status]: "valid",
                [PERMIT_FIELDS.issue_date]: expiredDate - 86400000 * 365,
                [PERMIT_FIELDS.expiration_date]: expiredDate,
                [PERMIT_FIELDS.created_at]: now,
                [PERMIT_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getExpiredPermits();

      expect(result).toHaveLength(1);
      expect(result[0].employee_id).toBe("emp001");
    });
  });

  describe("revokeExistingPermit", () => {
    it("既存の許可証を無効化する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [PERMIT_FIELDS.employee_id]: "emp001",
                [PERMIT_FIELDS.employee_name]: "山田太郎",
                [PERMIT_FIELDS.vehicle_id]: "veh001",
                [PERMIT_FIELDS.status]: "valid",
                [PERMIT_FIELDS.issue_date]: now,
                [PERMIT_FIELDS.expiration_date]: now + 86400000 * 365,
                [PERMIT_FIELDS.created_at]: now,
                [PERMIT_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await revokeExistingPermit("veh001");

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [PERMIT_FIELDS.status]: "revoked",
        })
      );
    });

    it("既存の許可証がない場合は何もしない", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      await revokeExistingPermit("nonexistent");

      expect(updateBaseRecord).not.toHaveBeenCalled();
    });
  });
});
