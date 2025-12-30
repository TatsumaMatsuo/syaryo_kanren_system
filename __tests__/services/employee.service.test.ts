import { describe, it, expect, vi, beforeEach } from "vitest";
import { EMPLOYEE_FIELDS } from "@/lib/lark-tables";

// Lark clientをモック
vi.mock("@/lib/lark-client", () => ({
  getBaseRecords: vi.fn(),
  updateBaseRecord: vi.fn(),
}));

import { getEmployees, getEmployee, retireEmployee, reactivateEmployee } from "@/services/employee.service";
import { getBaseRecords, updateBaseRecord } from "@/lib/lark-client";

describe("employee.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEmployees", () => {
    it("全社員を取得する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [EMPLOYEE_FIELDS.employee_id]: "emp001",
                [EMPLOYEE_FIELDS.employee_name]: "山田太郎",
                [EMPLOYEE_FIELDS.department]: "営業部",
                [EMPLOYEE_FIELDS.email]: "yamada@example.com",
                [EMPLOYEE_FIELDS.employment_status]: "active",
                [EMPLOYEE_FIELDS.role]: "applicant",
                [EMPLOYEE_FIELDS.hire_date]: Date.now(),
                [EMPLOYEE_FIELDS.created_at]: Date.now(),
                [EMPLOYEE_FIELDS.updated_at]: Date.now(),
              },
            },
            {
              record_id: "rec2",
              fields: {
                [EMPLOYEE_FIELDS.employee_id]: "emp002",
                [EMPLOYEE_FIELDS.employee_name]: "佐藤花子",
                [EMPLOYEE_FIELDS.department]: "経理部",
                [EMPLOYEE_FIELDS.email]: "sato@example.com",
                [EMPLOYEE_FIELDS.employment_status]: "active",
                [EMPLOYEE_FIELDS.role]: "applicant",
                [EMPLOYEE_FIELDS.hire_date]: Date.now(),
                [EMPLOYEE_FIELDS.created_at]: Date.now(),
                [EMPLOYEE_FIELDS.updated_at]: Date.now(),
              },
            },
          ],
        },
      } as any);

      const result = await getEmployees();

      expect(result).toHaveLength(2);
      expect(result[0].employee_id).toBe("emp001");
      expect(result[0].employee_name).toBe("山田太郎");
      expect(result[1].employee_id).toBe("emp002");
    });

    it("データがない場合は空配列を返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getEmployees();

      expect(result).toEqual([]);
    });

    it("エラー時は空配列を返す", async () => {
      vi.mocked(getBaseRecords).mockRejectedValue(new Error("API Error"));

      const result = await getEmployees();

      expect(result).toEqual([]);
    });
  });

  describe("getEmployee", () => {
    it("特定の社員を取得する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [EMPLOYEE_FIELDS.employee_id]: "emp001",
                [EMPLOYEE_FIELDS.employee_name]: "山田太郎",
                [EMPLOYEE_FIELDS.department]: "営業部",
                [EMPLOYEE_FIELDS.email]: "yamada@example.com",
                [EMPLOYEE_FIELDS.employment_status]: "active",
                [EMPLOYEE_FIELDS.role]: "applicant",
                [EMPLOYEE_FIELDS.hire_date]: Date.now(),
                [EMPLOYEE_FIELDS.created_at]: Date.now(),
                [EMPLOYEE_FIELDS.updated_at]: Date.now(),
              },
            },
          ],
        },
      } as any);

      const result = await getEmployee("emp001");

      expect(result).not.toBeNull();
      expect(result?.employee_id).toBe("emp001");
      expect(result?.employee_name).toBe("山田太郎");
    });

    it("存在しない社員はnullを返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getEmployee("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("retireEmployee", () => {
    it("社員を論理削除する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [EMPLOYEE_FIELDS.employee_id]: "emp001",
                [EMPLOYEE_FIELDS.employee_name]: "山田太郎",
                [EMPLOYEE_FIELDS.employment_status]: "active",
              },
            },
          ],
        },
      } as any);

      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await retireEmployee("emp001");

      expect(updateBaseRecord).toHaveBeenCalled();
    });
  });

  describe("reactivateEmployee", () => {
    it("論理削除を解除する", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [EMPLOYEE_FIELDS.employee_id]: "emp001",
                [EMPLOYEE_FIELDS.employee_name]: "山田太郎",
                [EMPLOYEE_FIELDS.employment_status]: "resigned",
              },
            },
          ],
        },
      } as any);

      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await reactivateEmployee("emp001");

      expect(updateBaseRecord).toHaveBeenCalled();
    });
  });
});
