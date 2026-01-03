import { describe, it, expect, vi, beforeEach } from "vitest";
import { INSURANCE_POLICY_FIELDS } from "@/lib/lark-tables";

// Lark clientをモック
vi.mock("@/lib/lark-client", () => ({
  getBaseRecords: vi.fn(),
  createBaseRecord: vi.fn(),
  updateBaseRecord: vi.fn(),
  deleteBaseRecord: vi.fn(),
}));

import {
  getInsurancePolicies,
  createInsurancePolicy,
  updateInsurancePolicy,
  deleteInsurancePolicy,
  approveInsurancePolicy,
  rejectInsurancePolicy,
  getExpiringInsurancePolicies,
  getExpiredInsurancePolicies,
} from "@/services/insurance-policy.service";
import {
  getBaseRecords,
  createBaseRecord,
  updateBaseRecord,
  deleteBaseRecord,
} from "@/lib/lark-client";

describe("insurance-policy.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getInsurancePolicies", () => {
    it("保険証一覧を取得する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [INSURANCE_POLICY_FIELDS.employee_id]: "emp001",
                [INSURANCE_POLICY_FIELDS.policy_number]: "POL-123456",
                [INSURANCE_POLICY_FIELDS.insurance_company]: "東京海上日動",
                [INSURANCE_POLICY_FIELDS.policy_type]: "任意保険",
                [INSURANCE_POLICY_FIELDS.coverage_start_date]: now,
                [INSURANCE_POLICY_FIELDS.coverage_end_date]: now + 86400000 * 365,
                [INSURANCE_POLICY_FIELDS.insured_amount]: 100000000,
                [INSURANCE_POLICY_FIELDS.liability_personal_unlimited]: true,
                [INSURANCE_POLICY_FIELDS.liability_property_amount]: 5000,
                [INSURANCE_POLICY_FIELDS.passenger_injury_amount]: 2000,
                [INSURANCE_POLICY_FIELDS.status]: "pending",
                [INSURANCE_POLICY_FIELDS.approval_status]: "pending",
                [INSURANCE_POLICY_FIELDS.deleted_flag]: false,
                [INSURANCE_POLICY_FIELDS.created_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getInsurancePolicies();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("rec1");
      expect(result[0].employee_id).toBe("emp001");
      expect(result[0].policy_number).toBe("POL-123456");
      expect(result[0].liability_personal_unlimited).toBe(true);
    });

    it("特定社員の保険証を取得する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [INSURANCE_POLICY_FIELDS.employee_id]: "emp001",
                [INSURANCE_POLICY_FIELDS.policy_number]: "POL-123456",
                [INSURANCE_POLICY_FIELDS.coverage_start_date]: now,
                [INSURANCE_POLICY_FIELDS.coverage_end_date]: now + 86400000 * 365,
                [INSURANCE_POLICY_FIELDS.deleted_flag]: false,
                [INSURANCE_POLICY_FIELDS.created_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getInsurancePolicies("emp001");

      expect(result).toHaveLength(1);
      expect(getBaseRecords).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filter: 'CurrentValue.[employee_id]="emp001"',
        })
      );
    });

    it("削除済みの保険証は除外する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [INSURANCE_POLICY_FIELDS.employee_id]: "emp001",
                [INSURANCE_POLICY_FIELDS.policy_number]: "POL-123456",
                [INSURANCE_POLICY_FIELDS.deleted_flag]: true,
              },
            },
            {
              record_id: "rec2",
              fields: {
                [INSURANCE_POLICY_FIELDS.employee_id]: "emp002",
                [INSURANCE_POLICY_FIELDS.policy_number]: "POL-789012",
                [INSURANCE_POLICY_FIELDS.deleted_flag]: false,
                [INSURANCE_POLICY_FIELDS.coverage_start_date]: now,
                [INSURANCE_POLICY_FIELDS.coverage_end_date]: now + 86400000 * 365,
                [INSURANCE_POLICY_FIELDS.created_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getInsurancePolicies();

      expect(result).toHaveLength(1);
      expect(result[0].employee_id).toBe("emp002");
    });

    it("データがない場合は空配列を返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getInsurancePolicies();

      expect(result).toEqual([]);
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(getBaseRecords).mockRejectedValue(new Error("API Error"));

      await expect(getInsurancePolicies()).rejects.toThrow("API Error");
    });
  });

  describe("createInsurancePolicy", () => {
    it("保険証を新規作成する", async () => {
      vi.mocked(createBaseRecord).mockResolvedValue({
        data: {
          record: {
            record_id: "new_rec",
          },
        },
      } as any);

      const data = {
        employee_id: "emp001",
        policy_number: "POL-123456",
        insurance_company: "東京海上日動",
        policy_type: "任意保険",
        coverage_start_date: new Date("2024-01-01"),
        coverage_end_date: new Date("2025-01-01"),
        insured_amount: 100000000,
        liability_personal_unlimited: true,
        liability_property_amount: 5000,
        passenger_injury_amount: 2000,
        image_url: "https://example.com/image.jpg",
        status: "pending" as const,
        approval_status: "pending" as const,
        deleted_flag: false,
      };

      const result = await createInsurancePolicy(data);

      expect(result.id).toBe("new_rec");
      expect(result.employee_id).toBe("emp001");
      expect(createBaseRecord).toHaveBeenCalled();
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(createBaseRecord).mockRejectedValue(new Error("Create Error"));

      const data = {
        employee_id: "emp001",
        policy_number: "POL-123456",
        insurance_company: "東京海上日動",
        policy_type: "任意保険",
        coverage_start_date: new Date("2024-01-01"),
        coverage_end_date: new Date("2025-01-01"),
        status: "pending" as const,
        approval_status: "pending" as const,
        deleted_flag: false,
      };

      await expect(createInsurancePolicy(data)).rejects.toThrow("Create Error");
    });
  });

  describe("updateInsurancePolicy", () => {
    it("保険証を更新する", async () => {
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await updateInsurancePolicy("rec1", {
        policy_number: "POL-999999",
        status: "approved",
      });

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [INSURANCE_POLICY_FIELDS.policy_number]: "POL-999999",
          [INSURANCE_POLICY_FIELDS.status]: "approved",
        })
      );
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(updateBaseRecord).mockRejectedValue(new Error("Update Error"));

      await expect(
        updateInsurancePolicy("rec1", { status: "approved" })
      ).rejects.toThrow("Update Error");
    });
  });

  describe("deleteInsurancePolicy", () => {
    it("保険証を削除する", async () => {
      vi.mocked(deleteBaseRecord).mockResolvedValue({} as any);

      await deleteInsurancePolicy("rec1");

      expect(deleteBaseRecord).toHaveBeenCalledWith(expect.any(String), "rec1");
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(deleteBaseRecord).mockRejectedValue(new Error("Delete Error"));

      await expect(deleteInsurancePolicy("rec1")).rejects.toThrow("Delete Error");
    });
  });

  describe("approveInsurancePolicy", () => {
    it("保険証を承認する", async () => {
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await approveInsurancePolicy("rec1");

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [INSURANCE_POLICY_FIELDS.status]: "approved",
          [INSURANCE_POLICY_FIELDS.approval_status]: "approved",
        })
      );
    });
  });

  describe("rejectInsurancePolicy", () => {
    it("保険証を却下する", async () => {
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await rejectInsurancePolicy("rec1", "補償内容が不足しています");

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [INSURANCE_POLICY_FIELDS.approval_status]: "rejected",
          [INSURANCE_POLICY_FIELDS.rejection_reason]: "補償内容が不足しています",
        })
      );
    });
  });

  describe("getExpiringInsurancePolicies", () => {
    it("期限切れ間近の保険証を取得する", async () => {
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
                [INSURANCE_POLICY_FIELDS.employee_id]: "emp001",
                [INSURANCE_POLICY_FIELDS.policy_number]: "POL-123456",
                [INSURANCE_POLICY_FIELDS.coverage_start_date]: Date.now(),
                [INSURANCE_POLICY_FIELDS.coverage_end_date]: expiringDate.getTime(),
                [INSURANCE_POLICY_FIELDS.status]: "approved",
                [INSURANCE_POLICY_FIELDS.approval_status]: "approved",
                [INSURANCE_POLICY_FIELDS.deleted_flag]: false,
                [INSURANCE_POLICY_FIELDS.created_at]: Date.now(),
                [INSURANCE_POLICY_FIELDS.updated_at]: Date.now(),
              },
            },
          ],
        },
      } as any);

      const result = await getExpiringInsurancePolicies(30);

      expect(result).toHaveLength(1);
      expect(result[0].employee_id).toBe("emp001");
    });

    it("承認されていない保険証は除外する", async () => {
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
                [INSURANCE_POLICY_FIELDS.employee_id]: "emp001",
                [INSURANCE_POLICY_FIELDS.coverage_end_date]: expiringDate.getTime(),
                [INSURANCE_POLICY_FIELDS.status]: "pending",
                [INSURANCE_POLICY_FIELDS.approval_status]: "pending",
                [INSURANCE_POLICY_FIELDS.deleted_flag]: false,
              },
            },
          ],
        },
      } as any);

      const result = await getExpiringInsurancePolicies(30);

      expect(result).toHaveLength(0);
    });
  });

  describe("getExpiredInsurancePolicies", () => {
    it("期限切れの保険証を取得する", async () => {
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
                [INSURANCE_POLICY_FIELDS.employee_id]: "emp001",
                [INSURANCE_POLICY_FIELDS.policy_number]: "POL-123456",
                [INSURANCE_POLICY_FIELDS.coverage_start_date]: Date.now() - 86400000 * 365,
                [INSURANCE_POLICY_FIELDS.coverage_end_date]: expiredDate.getTime(),
                [INSURANCE_POLICY_FIELDS.status]: "approved",
                [INSURANCE_POLICY_FIELDS.approval_status]: "approved",
                [INSURANCE_POLICY_FIELDS.deleted_flag]: false,
                [INSURANCE_POLICY_FIELDS.created_at]: Date.now(),
                [INSURANCE_POLICY_FIELDS.updated_at]: Date.now(),
              },
            },
          ],
        },
      } as any);

      const result = await getExpiredInsurancePolicies();

      expect(result).toHaveLength(1);
      expect(result[0].employee_id).toBe("emp001");
    });

    it("削除済みの保険証は除外する", async () => {
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
                [INSURANCE_POLICY_FIELDS.employee_id]: "emp001",
                [INSURANCE_POLICY_FIELDS.coverage_end_date]: expiredDate.getTime(),
                [INSURANCE_POLICY_FIELDS.status]: "approved",
                [INSURANCE_POLICY_FIELDS.approval_status]: "approved",
                [INSURANCE_POLICY_FIELDS.deleted_flag]: true,
              },
            },
          ],
        },
      } as any);

      const result = await getExpiredInsurancePolicies();

      expect(result).toHaveLength(0);
    });
  });
});
