import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { APPROVAL_HISTORY_FIELDS } from "@/lib/lark-tables";

// Lark clientをモック
vi.mock("@/lib/lark-client", () => ({
  getBaseRecords: vi.fn(),
  createBaseRecord: vi.fn(),
}));

import {
  recordApprovalHistory,
  getApprovalHistory,
  getApprovalHistoryByEmployee,
} from "@/services/approval-history.service";
import { getBaseRecords, createBaseRecord } from "@/lib/lark-client";

describe("approval-history.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("recordApprovalHistory", () => {
    it("承認履歴を正常に記録する", async () => {
      vi.mocked(createBaseRecord).mockResolvedValue({
        data: { record: { record_id: "rec123" } },
      } as any);

      const record = {
        application_type: "license" as const,
        application_id: "app123",
        employee_id: "emp123",
        employee_name: "テスト太郎",
        action: "approved" as const,
        approver_id: "admin1",
        approver_name: "管理者",
        timestamp: Date.now(),
      };

      const result = await recordApprovalHistory(record);

      expect(result).toBe(true);
      expect(createBaseRecord).toHaveBeenCalled();
    });

    it("却下履歴を理由付きで記録する", async () => {
      vi.mocked(createBaseRecord).mockResolvedValue({
        data: { record: { record_id: "rec124" } },
      } as any);

      const record = {
        application_type: "vehicle" as const,
        application_id: "app124",
        employee_id: "emp124",
        employee_name: "テスト次郎",
        action: "rejected" as const,
        approver_id: "admin1",
        approver_name: "管理者",
        reason: "書類不備のため",
        timestamp: Date.now(),
      };

      const result = await recordApprovalHistory(record);

      expect(result).toBe(true);
    });

    it("エラー時はfalseを返す", async () => {
      vi.mocked(createBaseRecord).mockRejectedValue(new Error("API Error"));

      const record = {
        application_type: "insurance" as const,
        application_id: "app125",
        employee_id: "emp125",
        employee_name: "テスト三郎",
        action: "approved" as const,
        approver_id: "admin1",
        approver_name: "管理者",
        timestamp: Date.now(),
      };

      const result = await recordApprovalHistory(record);

      expect(result).toBe(false);
    });
  });

  describe("getApprovalHistory", () => {
    it("承認履歴一覧を取得する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [APPROVAL_HISTORY_FIELDS.application_type]: "license",
                [APPROVAL_HISTORY_FIELDS.application_id]: "app1",
                [APPROVAL_HISTORY_FIELDS.employee_id]: "emp1",
                [APPROVAL_HISTORY_FIELDS.employee_name]: "テスト太郎",
                [APPROVAL_HISTORY_FIELDS.action]: "approved",
                [APPROVAL_HISTORY_FIELDS.approver_id]: "admin1",
                [APPROVAL_HISTORY_FIELDS.approver_name]: "管理者",
                [APPROVAL_HISTORY_FIELDS.timestamp]: 1700000000000,
              },
            },
            {
              record_id: "rec2",
              fields: {
                [APPROVAL_HISTORY_FIELDS.application_type]: "vehicle",
                [APPROVAL_HISTORY_FIELDS.application_id]: "app2",
                [APPROVAL_HISTORY_FIELDS.employee_id]: "emp2",
                [APPROVAL_HISTORY_FIELDS.employee_name]: "テスト次郎",
                [APPROVAL_HISTORY_FIELDS.action]: "rejected",
                [APPROVAL_HISTORY_FIELDS.approver_id]: "admin1",
                [APPROVAL_HISTORY_FIELDS.approver_name]: "管理者",
                [APPROVAL_HISTORY_FIELDS.reason]: "書類不備",
                [APPROVAL_HISTORY_FIELDS.timestamp]: 1700000001000,
              },
            },
          ],
        },
      } as any);

      const result = await getApprovalHistory();

      expect(result).toHaveLength(2);
      expect(result[0].application_type).toBe("license");
      expect(result[0].action).toBe("approved");
      expect(result[1].application_type).toBe("vehicle");
      expect(result[1].action).toBe("rejected");
      expect(result[1].reason).toBe("書類不備");
    });

    it("データがない場合は空配列を返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getApprovalHistory();

      expect(result).toEqual([]);
    });
  });

  describe("getApprovalHistoryByEmployee", () => {
    it("特定社員の承認履歴を取得する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [APPROVAL_HISTORY_FIELDS.application_type]: "license",
                [APPROVAL_HISTORY_FIELDS.application_id]: "app1",
                [APPROVAL_HISTORY_FIELDS.employee_id]: "emp123",
                [APPROVAL_HISTORY_FIELDS.employee_name]: "テスト太郎",
                [APPROVAL_HISTORY_FIELDS.action]: "approved",
                [APPROVAL_HISTORY_FIELDS.approver_id]: "admin1",
                [APPROVAL_HISTORY_FIELDS.approver_name]: "管理者",
                [APPROVAL_HISTORY_FIELDS.timestamp]: 1700000000000,
              },
            },
          ],
        },
      } as any);

      const result = await getApprovalHistoryByEmployee("emp123");

      expect(result).toHaveLength(1);
      expect(result[0].employee_id).toBe("emp123");
    });
  });
});
