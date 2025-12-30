import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DriversLicense, VehicleRegistration, InsurancePolicy } from "@/types";

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

// テスト用のモックデータ作成ヘルパー
const createMockLicense = (overrides: Partial<DriversLicense>): DriversLicense => ({
  id: "lic1",
  employee_id: "emp1",
  license_number: "12345",
  license_type: "普通",
  issue_date: new Date("2020-01-01"),
  expiration_date: new Date("2025-01-20"),
  image_url: "https://example.com/image.jpg",
  status: "approved",
  approval_status: "approved",
  created_at: new Date(),
  updated_at: new Date(),
  deleted_flag: false,
  ...overrides,
});

const createMockVehicle = (overrides: Partial<VehicleRegistration>): VehicleRegistration => ({
  id: "veh1",
  employee_id: "emp1",
  vehicle_number: "ABC-123",
  vehicle_type: "普通乗用車",
  manufacturer: "トヨタ",
  model_name: "プリウス",
  inspection_expiration_date: new Date("2025-01-18"),
  owner_name: "テスト太郎",
  image_url: "https://example.com/vehicle.jpg",
  status: "approved",
  approval_status: "approved",
  created_at: new Date(),
  updated_at: new Date(),
  deleted_flag: false,
  ...overrides,
});

const createMockInsurance = (overrides: Partial<InsurancePolicy>): InsurancePolicy => ({
  id: "ins1",
  employee_id: "emp1",
  policy_number: "POL-001",
  insurance_company: "東京海上",
  policy_type: "任意保険",
  coverage_start_date: new Date("2024-01-01"),
  coverage_end_date: new Date("2025-01-22"),
  liability_personal_unlimited: true,
  liability_property_amount: 5000,
  passenger_injury_amount: 2000,
  image_url: "https://example.com/insurance.jpg",
  status: "approved",
  approval_status: "approved",
  created_at: new Date(),
  updated_at: new Date(),
  deleted_flag: false,
  ...overrides,
});

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
      const mockLicense = createMockLicense({
        id: "lic1",
        employee_id: "emp1",
        expiration_date: new Date("2025-01-20"),
      });

      const mockVehicle = createMockVehicle({
        id: "veh1",
        employee_id: "emp2",
        inspection_expiration_date: new Date("2025-01-18"),
      });

      const mockInsurance = createMockInsurance({
        id: "ins1",
        employee_id: "emp3",
        coverage_end_date: new Date("2025-01-22"),
      });

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
      const mockLicense = createMockLicense({
        expiration_date: new Date("2025-01-20"),
      });

      vi.mocked(getExpiringDriversLicenses).mockResolvedValue([mockLicense]);
      vi.mocked(getExpiringVehicleRegistrations).mockResolvedValue([]);
      vi.mocked(getExpiringInsurancePolicies).mockResolvedValue([]);

      const result = await getExpiringDocuments();

      expect(result[0].daysUntilExpiration).toBe(5);
    });
  });

  describe("getExpiredDocuments", () => {
    it("期限切れ書類を取得し、負の日数を返す", async () => {
      const mockLicense = createMockLicense({
        expiration_date: new Date("2025-01-10"),
      });

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
        createMockLicense({ id: "1", employee_id: "e1", license_number: "L1", expiration_date: new Date("2025-01-20") }),
        createMockLicense({ id: "2", employee_id: "e2", license_number: "L2", expiration_date: new Date("2025-01-21") }),
      ]);
      vi.mocked(getExpiringVehicleRegistrations).mockResolvedValue([
        createMockVehicle({ id: "1", employee_id: "e1", vehicle_number: "V1", inspection_expiration_date: new Date("2025-01-19") }),
      ]);
      vi.mocked(getExpiringInsurancePolicies).mockResolvedValue([]);

      vi.mocked(getExpiredDriversLicenses).mockResolvedValue([
        createMockLicense({ id: "3", employee_id: "e3", license_number: "L3", expiration_date: new Date("2025-01-10") }),
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
