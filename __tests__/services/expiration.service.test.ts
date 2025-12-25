import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// サービスをモック
vi.mock("@/services/drivers-license.service", () => ({
  getExpiringDriversLicenses: vi.fn(),
  getExpiredDriversLicenses: vi.fn(),
}));

vi.mock("@/services/vehicle-registration.service", () => ({
  getExpiringVehicleRegistrations: vi.fn(),
  getExpiredVehicleRegistrations: vi.fn(),
}));

vi.mock("@/services/insurance-policy.service", () => ({
  getExpiringInsurancePolicies: vi.fn(),
  getExpiredInsurancePolicies: vi.fn(),
}));

import {
  getExpiringDocuments,
  getExpiredDocuments,
  getExpirationSummary,
} from "@/services/expiration.service";
import { getExpiringDriversLicenses, getExpiredDriversLicenses } from "@/services/drivers-license.service";
import { getExpiringVehicleRegistrations, getExpiredVehicleRegistrations } from "@/services/vehicle-registration.service";
import { getExpiringInsurancePolicies, getExpiredInsurancePolicies } from "@/services/insurance-policy.service";

describe("expiration.service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  describe("getExpiringDocuments", () => {
    it("期限切れ間近の書類を全て取得する", async () => {
      const mockLicense = {
        id: "lic1",
        employee_id: "emp1",
        license_number: "12345",
        expiration_date: new Date("2025-01-20"),
      };

      const mockVehicle = {
        id: "veh1",
        employee_id: "emp2",
        vehicle_number: "ABC-123",
        inspection_expiration_date: new Date("2025-01-18"),
      };

      const mockInsurance = {
        id: "ins1",
        employee_id: "emp3",
        policy_number: "POL-001",
        coverage_end_date: new Date("2025-01-22"),
      };

      vi.mocked(getExpiringDriversLicenses).mockResolvedValue([mockLicense]);
      vi.mocked(getExpiringVehicleRegistrations).mockResolvedValue([mockVehicle]);
      vi.mocked(getExpiringInsurancePolicies).mockResolvedValue([mockInsurance]);

      const result = await getExpiringDocuments();

      expect(result).toHaveLength(3);
      expect(result.find(w => w.type === "license")).toBeDefined();
      expect(result.find(w => w.type === "vehicle")).toBeDefined();
      expect(result.find(w => w.type === "insurance")).toBeDefined();
    });

    it("残り日数を正しく計算する", async () => {
      const mockLicense = {
        id: "lic1",
        employee_id: "emp1",
        license_number: "12345",
        expiration_date: new Date("2025-01-20"),
      };

      vi.mocked(getExpiringDriversLicenses).mockResolvedValue([mockLicense]);
      vi.mocked(getExpiringVehicleRegistrations).mockResolvedValue([]);
      vi.mocked(getExpiringInsurancePolicies).mockResolvedValue([]);

      const result = await getExpiringDocuments();

      expect(result[0].daysUntilExpiration).toBe(5);
    });
  });

  describe("getExpiredDocuments", () => {
    it("期限切れ書類を取得し、負の日数を返す", async () => {
      const mockLicense = {
        id: "lic1",
        employee_id: "emp1",
        license_number: "12345",
        expiration_date: new Date("2025-01-10"),
      };

      vi.mocked(getExpiredDriversLicenses).mockResolvedValue([mockLicense]);
      vi.mocked(getExpiredVehicleRegistrations).mockResolvedValue([]);
      vi.mocked(getExpiredInsurancePolicies).mockResolvedValue([]);

      const result = await getExpiredDocuments();

      expect(result).toHaveLength(1);
      expect(result[0].daysUntilExpiration).toBeLessThan(0);
    });
  });

  describe("getExpirationSummary", () => {
    it("期限切れと期限切れ間近のサマリーを返す", async () => {
      vi.mocked(getExpiringDriversLicenses).mockResolvedValue([
        { id: "1", employee_id: "e1", license_number: "L1", expiration_date: new Date("2025-01-20") },
        { id: "2", employee_id: "e2", license_number: "L2", expiration_date: new Date("2025-01-21") },
      ]);
      vi.mocked(getExpiringVehicleRegistrations).mockResolvedValue([
        { id: "1", employee_id: "e1", vehicle_number: "V1", inspection_expiration_date: new Date("2025-01-19") },
      ]);
      vi.mocked(getExpiringInsurancePolicies).mockResolvedValue([]);

      vi.mocked(getExpiredDriversLicenses).mockResolvedValue([
        { id: "3", employee_id: "e3", license_number: "L3", expiration_date: new Date("2025-01-10") },
      ]);
      vi.mocked(getExpiredVehicleRegistrations).mockResolvedValue([]);
      vi.mocked(getExpiredInsurancePolicies).mockResolvedValue([]);

      const result = await getExpirationSummary();

      expect(result.expiringCount).toBe(3);
      expect(result.expiredCount).toBe(1);
      expect(result.expiringByType.license).toBe(2);
      expect(result.expiringByType.vehicle).toBe(1);
      expect(result.expiringByType.insurance).toBe(0);
      expect(result.expiredByType.license).toBe(1);
    });
  });
});
