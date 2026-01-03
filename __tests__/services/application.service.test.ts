import { describe, it, expect, vi, beforeEach } from "vitest";
import { EMPLOYEE_FIELDS } from "@/lib/lark-tables";

// Lark clientをモック
vi.mock("@/lib/lark-client", () => ({
  getBaseRecords: vi.fn(),
}));

import {
  getApplicationOverview,
  getPendingApplications,
  getApprovedApplications,
} from "@/services/application.service";
import { getBaseRecords } from "@/lib/lark-client";

describe("application.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEmployee = {
    record_id: "emp_rec1",
    fields: {
      [EMPLOYEE_FIELDS.employee_id]: "emp001",
      [EMPLOYEE_FIELDS.employee_name]: "山田太郎",
      [EMPLOYEE_FIELDS.email]: "yamada@example.com",
      [EMPLOYEE_FIELDS.department]: "営業部",
      role: "applicant",
    },
  };

  const mockLicense = {
    record_id: "lic_rec1",
    fields: {
      employee_id: "emp001",
      license_number: "123456789012",
      license_type: "普通",
      expiration_date: Date.now() + 86400000 * 365,
      status: "pending",
      approval_status: "pending",
      deleted_flag: false,
    },
  };

  const mockVehicle = {
    record_id: "veh_rec1",
    fields: {
      employee_id: "emp001",
      vehicle_number: "品川500あ1234",
      expiration_date: Date.now() + 86400000 * 365,
      status: "pending",
      approval_status: "pending",
      deleted_flag: false,
    },
  };

  const mockInsurance = {
    record_id: "ins_rec1",
    fields: {
      employee_id: "emp001",
      policy_number: "POL-123456",
      coverage_end_date: Date.now() + 86400000 * 365,
      status: "pending",
      approval_status: "pending",
      deleted_flag: false,
    },
  };

  describe("getApplicationOverview", () => {
    it("社員の申請情報を統合ビューで取得する", async () => {
      vi.mocked(getBaseRecords)
        .mockResolvedValueOnce({ data: { items: [mockLicense] } } as any) // licenses
        .mockResolvedValueOnce({ data: { items: [mockVehicle] } } as any) // vehicles
        .mockResolvedValueOnce({ data: { items: [mockInsurance] } } as any) // insurances
        .mockResolvedValueOnce({ data: { items: [mockEmployee] } } as any); // employees

      const result = await getApplicationOverview();

      expect(result).toHaveLength(1);
      expect(result[0].employee.employee_id).toBe("emp001");
      expect(result[0].license).not.toBeNull();
      expect(result[0].vehicles).toHaveLength(1);
      expect(result[0].insurances).toHaveLength(1);
    });

    it("特定社員の申請情報を取得する", async () => {
      vi.mocked(getBaseRecords)
        .mockResolvedValueOnce({ data: { items: [mockLicense] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockVehicle] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockInsurance] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockEmployee] } } as any);

      const result = await getApplicationOverview("emp001");

      expect(result).toHaveLength(1);
      expect(result[0].employee.employee_id).toBe("emp001");
    });

    it("削除済みの書類は除外する", async () => {
      const deletedLicense = {
        ...mockLicense,
        fields: {
          ...mockLicense.fields,
          deleted_flag: true,
        },
      };

      vi.mocked(getBaseRecords)
        .mockResolvedValueOnce({ data: { items: [deletedLicense] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockVehicle] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockInsurance] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockEmployee] } } as any);

      const result = await getApplicationOverview();

      expect(result).toHaveLength(1);
      expect(result[0].license).toBeNull();
    });

    it("書類がない社員は除外する", async () => {
      const employeeWithNoDocs = {
        ...mockEmployee,
        fields: {
          ...mockEmployee.fields,
          [EMPLOYEE_FIELDS.employee_id]: "emp002",
        },
      };

      vi.mocked(getBaseRecords)
        .mockResolvedValueOnce({ data: { items: [] } } as any) // no licenses
        .mockResolvedValueOnce({ data: { items: [] } } as any) // no vehicles
        .mockResolvedValueOnce({ data: { items: [] } } as any) // no insurances
        .mockResolvedValueOnce({ data: { items: [employeeWithNoDocs] } } as any);

      const result = await getApplicationOverview();

      expect(result).toHaveLength(0);
    });

    it("複数の車検証・保険証を配列で返す", async () => {
      const secondVehicle = {
        ...mockVehicle,
        record_id: "veh_rec2",
        fields: {
          ...mockVehicle.fields,
          vehicle_number: "横浜300い5678",
        },
      };

      const secondInsurance = {
        ...mockInsurance,
        record_id: "ins_rec2",
        fields: {
          ...mockInsurance.fields,
          policy_number: "POL-789012",
        },
      };

      vi.mocked(getBaseRecords)
        .mockResolvedValueOnce({ data: { items: [mockLicense] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockVehicle, secondVehicle] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockInsurance, secondInsurance] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockEmployee] } } as any);

      const result = await getApplicationOverview();

      expect(result).toHaveLength(1);
      expect(result[0].vehicles).toHaveLength(2);
      expect(result[0].insurances).toHaveLength(2);
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(getBaseRecords).mockRejectedValue(new Error("API Error"));

      await expect(getApplicationOverview()).rejects.toThrow("API Error");
    });
  });

  describe("getPendingApplications", () => {
    it("承認待ちの申請を取得する", async () => {
      vi.mocked(getBaseRecords)
        .mockResolvedValueOnce({ data: { items: [mockLicense] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockVehicle] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockInsurance] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockEmployee] } } as any);

      const result = await getPendingApplications();

      expect(result).toHaveLength(1);
      expect(result[0].license?.approval_status).toBe("pending");
    });

    it("承認済みの申請は除外する", async () => {
      const approvedLicense = {
        ...mockLicense,
        fields: {
          ...mockLicense.fields,
          approval_status: "approved",
        },
      };
      const approvedVehicle = {
        ...mockVehicle,
        fields: {
          ...mockVehicle.fields,
          approval_status: "approved",
        },
      };
      const approvedInsurance = {
        ...mockInsurance,
        fields: {
          ...mockInsurance.fields,
          approval_status: "approved",
        },
      };

      vi.mocked(getBaseRecords)
        .mockResolvedValueOnce({ data: { items: [approvedLicense] } } as any)
        .mockResolvedValueOnce({ data: { items: [approvedVehicle] } } as any)
        .mockResolvedValueOnce({ data: { items: [approvedInsurance] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockEmployee] } } as any);

      const result = await getPendingApplications();

      expect(result).toHaveLength(0);
    });

    it("一部でもpendingがあれば取得する", async () => {
      const approvedLicense = {
        ...mockLicense,
        fields: {
          ...mockLicense.fields,
          approval_status: "approved",
        },
      };
      // vehicleはpending

      vi.mocked(getBaseRecords)
        .mockResolvedValueOnce({ data: { items: [approvedLicense] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockVehicle] } } as any) // pending
        .mockResolvedValueOnce({ data: { items: [mockInsurance] } } as any) // pending
        .mockResolvedValueOnce({ data: { items: [mockEmployee] } } as any);

      const result = await getPendingApplications();

      expect(result).toHaveLength(1);
    });
  });

  describe("getApprovedApplications", () => {
    it("全て承認済みの申請を取得する", async () => {
      const approvedLicense = {
        ...mockLicense,
        fields: {
          ...mockLicense.fields,
          approval_status: "approved",
        },
      };
      const approvedVehicle = {
        ...mockVehicle,
        fields: {
          ...mockVehicle.fields,
          approval_status: "approved",
        },
      };
      const approvedInsurance = {
        ...mockInsurance,
        fields: {
          ...mockInsurance.fields,
          approval_status: "approved",
        },
      };

      vi.mocked(getBaseRecords)
        .mockResolvedValueOnce({ data: { items: [approvedLicense] } } as any)
        .mockResolvedValueOnce({ data: { items: [approvedVehicle] } } as any)
        .mockResolvedValueOnce({ data: { items: [approvedInsurance] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockEmployee] } } as any);

      const result = await getApprovedApplications();

      expect(result).toHaveLength(1);
    });

    it("一部でも未承認があれば除外する", async () => {
      const approvedLicense = {
        ...mockLicense,
        fields: {
          ...mockLicense.fields,
          approval_status: "approved",
        },
      };
      // vehicleはpending

      vi.mocked(getBaseRecords)
        .mockResolvedValueOnce({ data: { items: [approvedLicense] } } as any)
        .mockResolvedValueOnce({ data: { items: [mockVehicle] } } as any) // pending
        .mockResolvedValueOnce({ data: { items: [mockInsurance] } } as any) // pending
        .mockResolvedValueOnce({ data: { items: [mockEmployee] } } as any);

      const result = await getApprovedApplications();

      expect(result).toHaveLength(0);
    });

    it("車検証・保険証が0件の場合は承認済みとしない", async () => {
      const approvedLicense = {
        ...mockLicense,
        fields: {
          ...mockLicense.fields,
          approval_status: "approved",
        },
      };

      vi.mocked(getBaseRecords)
        .mockResolvedValueOnce({ data: { items: [approvedLicense] } } as any)
        .mockResolvedValueOnce({ data: { items: [] } } as any) // no vehicles
        .mockResolvedValueOnce({ data: { items: [] } } as any) // no insurances
        .mockResolvedValueOnce({ data: { items: [mockEmployee] } } as any);

      const result = await getApprovedApplications();

      expect(result).toHaveLength(0);
    });
  });
});
