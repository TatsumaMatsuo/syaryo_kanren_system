import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculatePermitExpiration,
  isPermitValid,
  getDaysUntilExpiration,
  getPermitStatusLabel,
  formatDate,
  formatDateSlash,
  generateVerificationUrl,
} from "@/lib/permit-utils";
import type { Permit } from "@/types";

describe("permit-utils", () => {
  describe("calculatePermitExpiration", () => {
    it("3つの日付の中で最も早い日付を返す", () => {
      const license = new Date("2025-06-01");
      const vehicle = new Date("2025-03-15");
      const insurance = new Date("2025-09-30");

      const result = calculatePermitExpiration(license, vehicle, insurance);

      expect(result.getTime()).toBe(vehicle.getTime());
    });

    it("同じ日付の場合はその日付を返す", () => {
      const date = new Date("2025-06-01");

      const result = calculatePermitExpiration(date, date, date);

      expect(result.getTime()).toBe(date.getTime());
    });
  });

  describe("isPermitValid", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("有効なステータスで期限内の場合はtrueを返す", () => {
      const permit: Permit = {
        id: "1",
        employee_id: "emp1",
        employee_name: "テスト太郎",
        vehicle_id: "v1",
        vehicle_number: "品川 300 あ 1234",
        vehicle_model: "プリウス",
        issue_date: new Date(),
        status: "valid",
        expiration_date: new Date("2025-12-31"),
        permit_file_key: "file-key-001",
        verification_token: "token123",
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(isPermitValid(permit)).toBe(true);
    });

    it("期限切れの場合はfalseを返す", () => {
      const permit: Permit = {
        id: "1",
        employee_id: "emp1",
        employee_name: "テスト太郎",
        vehicle_id: "v1",
        vehicle_number: "品川 300 あ 1234",
        vehicle_model: "プリウス",
        issue_date: new Date(),
        status: "valid",
        expiration_date: new Date("2024-12-31"),
        permit_file_key: "file-key-001",
        verification_token: "token123",
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(isPermitValid(permit)).toBe(false);
    });

    it("ステータスがexpiredの場合はfalseを返す", () => {
      const permit: Permit = {
        id: "1",
        employee_id: "emp1",
        employee_name: "テスト太郎",
        vehicle_id: "v1",
        vehicle_number: "品川 300 あ 1234",
        vehicle_model: "プリウス",
        issue_date: new Date(),
        status: "expired",
        expiration_date: new Date("2025-12-31"),
        permit_file_key: "file-key-001",
        verification_token: "token123",
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(isPermitValid(permit)).toBe(false);
    });

    it("ステータスがrevokedの場合はfalseを返す", () => {
      const permit: Permit = {
        id: "1",
        employee_id: "emp1",
        employee_name: "テスト太郎",
        vehicle_id: "v1",
        vehicle_number: "品川 300 あ 1234",
        vehicle_model: "プリウス",
        issue_date: new Date(),
        status: "revoked",
        expiration_date: new Date("2025-12-31"),
        permit_file_key: "file-key-001",
        verification_token: "token123",
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(isPermitValid(permit)).toBe(false);
    });
  });

  describe("getDaysUntilExpiration", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("有効期限までの日数を正しく計算する", () => {
      const expirationDate = new Date("2025-01-11T00:00:00Z");

      expect(getDaysUntilExpiration(expirationDate)).toBe(10);
    });

    it("過去の日付の場合は負の値を返す", () => {
      const expirationDate = new Date("2024-12-25T00:00:00Z");

      expect(getDaysUntilExpiration(expirationDate)).toBeLessThan(0);
    });
  });

  describe("getPermitStatusLabel", () => {
    it("validの場合は「有効」を返す", () => {
      expect(getPermitStatusLabel("valid")).toBe("有効");
    });

    it("expiredの場合は「期限切れ」を返す", () => {
      expect(getPermitStatusLabel("expired")).toBe("期限切れ");
    });

    it("revokedの場合は「取消済」を返す", () => {
      expect(getPermitStatusLabel("revoked")).toBe("取消済");
    });
  });

  describe("formatDate", () => {
    it("日付を「YYYY年MM月DD日」形式でフォーマットする", () => {
      const date = new Date("2025-03-15");

      expect(formatDate(date)).toBe("2025年03月15日");
    });

    it("1桁の月日を0埋めする", () => {
      const date = new Date("2025-01-05");

      expect(formatDate(date)).toBe("2025年01月05日");
    });
  });

  describe("formatDateSlash", () => {
    it("日付を「YYYY/MM/DD」形式でフォーマットする", () => {
      const date = new Date("2025-03-15");

      expect(formatDateSlash(date)).toBe("2025/03/15");
    });
  });

  describe("generateVerificationUrl", () => {
    it("検証用URLを正しく生成する", () => {
      const baseUrl = "https://example.com";
      const token = "abc123";

      expect(generateVerificationUrl(baseUrl, token)).toBe(
        "https://example.com/verify/abc123"
      );
    });
  });
});
