import {
  getDriversLicenses,
  getExpiringDriversLicenses,
  getExpiredDriversLicenses,
} from "./drivers-license.service";
import {
  getVehicleRegistrations,
  getExpiringVehicleRegistrations,
  getExpiredVehicleRegistrations,
} from "./vehicle-registration.service";
import {
  getInsurancePolicies,
  getExpiringInsurancePolicies,
  getExpiredInsurancePolicies,
} from "./insurance-policy.service";
import { getEmployees } from "./employee.service";
import { DriversLicense, VehicleRegistration, InsurancePolicy } from "@/types";

export interface ExpirationWarning {
  type: "license" | "vehicle" | "insurance";
  documentId: string;
  employeeId: string;
  employeeName: string;
  documentNumber: string;
  expirationDate: Date;
  daysUntilExpiration: number;
}

/**
 * 全ての有効期限切れ間近の書類を取得（1週間以内）
 */
export async function getExpiringDocuments(): Promise<ExpirationWarning[]> {
  const [licenses, vehicles, insurances, employees] = await Promise.all([
    getExpiringDriversLicenses(),
    getExpiringVehicleRegistrations(),
    getExpiringInsurancePolicies(),
    getEmployees(true), // 退職者含む全社員を取得
  ]);

  // 社員IDから社員名を取得するマップを作成
  // 社員コードとメールアドレス両方でマッチできるようにする
  const employeeMap = new Map<string, string>();
  employees.forEach((emp) => {
    if (emp.employee_id) {
      employeeMap.set(emp.employee_id, emp.employee_name);
    }
    if (emp.email) {
      employeeMap.set(emp.email, emp.employee_name);
    }
  });
  console.log("[getExpiringDocuments] employeeMap size:", employeeMap.size);
  console.log("[getExpiringDocuments] employeeMap keys:", Array.from(employeeMap.keys()).slice(0, 5));

  const warnings: ExpirationWarning[] = [];

  // 免許証
  licenses.forEach((license) => {
    const daysUntil = Math.ceil(
      (license.expiration_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    warnings.push({
      type: "license",
      documentId: license.id,
      employeeId: license.employee_id,
      employeeName: employeeMap.get(license.employee_id) || license.employee_id,
      documentNumber: license.license_number,
      expirationDate: license.expiration_date,
      daysUntilExpiration: daysUntil,
    });
  });

  // 車検証
  vehicles.forEach((vehicle) => {
    const daysUntil = Math.ceil(
      (vehicle.inspection_expiration_date.getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );
    warnings.push({
      type: "vehicle",
      documentId: vehicle.id,
      employeeId: vehicle.employee_id,
      employeeName: employeeMap.get(vehicle.employee_id) || vehicle.employee_id,
      documentNumber: vehicle.vehicle_number,
      expirationDate: vehicle.inspection_expiration_date,
      daysUntilExpiration: daysUntil,
    });
  });

  // 任意保険
  insurances.forEach((insurance) => {
    const daysUntil = Math.ceil(
      (insurance.coverage_end_date.getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );
    warnings.push({
      type: "insurance",
      documentId: insurance.id,
      employeeId: insurance.employee_id,
      employeeName: employeeMap.get(insurance.employee_id) || insurance.employee_id,
      documentNumber: insurance.policy_number,
      expirationDate: insurance.coverage_end_date,
      daysUntilExpiration: daysUntil,
    });
  });

  return warnings;
}

/**
 * 全ての期限切れ書類を取得
 */
export async function getExpiredDocuments(): Promise<ExpirationWarning[]> {
  const [licenses, vehicles, insurances, employees] = await Promise.all([
    getExpiredDriversLicenses(),
    getExpiredVehicleRegistrations(),
    getExpiredInsurancePolicies(),
    getEmployees(true), // 退職者含む全社員を取得
  ]);

  // 社員IDから社員名を取得するマップを作成
  // 社員コードとメールアドレス両方でマッチできるようにする
  const employeeMap = new Map<string, string>();
  employees.forEach((emp) => {
    if (emp.employee_id) {
      employeeMap.set(emp.employee_id, emp.employee_name);
    }
    if (emp.email) {
      employeeMap.set(emp.email, emp.employee_name);
    }
  });

  const warnings: ExpirationWarning[] = [];

  // 免許証
  licenses.forEach((license) => {
    const daysOverdue = Math.ceil(
      (Date.now() - license.expiration_date.getTime()) / (1000 * 60 * 60 * 24)
    );
    warnings.push({
      type: "license",
      documentId: license.id,
      employeeId: license.employee_id,
      employeeName: employeeMap.get(license.employee_id) || license.employee_id,
      documentNumber: license.license_number,
      expirationDate: license.expiration_date,
      daysUntilExpiration: -daysOverdue,
    });
  });

  // 車検証
  vehicles.forEach((vehicle) => {
    const daysOverdue = Math.ceil(
      (Date.now() - vehicle.inspection_expiration_date.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    warnings.push({
      type: "vehicle",
      documentId: vehicle.id,
      employeeId: vehicle.employee_id,
      employeeName: employeeMap.get(vehicle.employee_id) || vehicle.employee_id,
      documentNumber: vehicle.vehicle_number,
      expirationDate: vehicle.inspection_expiration_date,
      daysUntilExpiration: -daysOverdue,
    });
  });

  // 任意保険
  insurances.forEach((insurance) => {
    const daysOverdue = Math.ceil(
      (Date.now() - insurance.coverage_end_date.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    warnings.push({
      type: "insurance",
      documentId: insurance.id,
      employeeId: insurance.employee_id,
      employeeName: employeeMap.get(insurance.employee_id) || insurance.employee_id,
      documentNumber: insurance.policy_number,
      expirationDate: insurance.coverage_end_date,
      daysUntilExpiration: -daysOverdue,
    });
  });

  return warnings;
}

/**
 * 有効期限のサマリー情報を取得
 */
export async function getExpirationSummary() {
  const [expiring, expired] = await Promise.all([
    getExpiringDocuments(),
    getExpiredDocuments(),
  ]);

  // デバッグログ
  console.log("[Expiration Summary] expiring count:", expiring.length);
  console.log("[Expiration Summary] expired count:", expired.length);
  if (expiring.length > 0) {
    console.log("[Expiration Summary] expiring sample:", JSON.stringify(expiring[0]));
  }
  if (expired.length > 0) {
    console.log("[Expiration Summary] expired sample:", JSON.stringify(expired[0]));
  }

  // 期限が近い順にソート（expiringは昇順、expiredは降順）
  expiring.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
  expired.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);

  return {
    expiringCount: expiring.length,
    expiredCount: expired.length,
    expiringByType: {
      license: expiring.filter((w) => w.type === "license").length,
      vehicle: expiring.filter((w) => w.type === "vehicle").length,
      insurance: expiring.filter((w) => w.type === "insurance").length,
    },
    expiredByType: {
      license: expired.filter((w) => w.type === "license").length,
      vehicle: expired.filter((w) => w.type === "vehicle").length,
      insurance: expired.filter((w) => w.type === "insurance").length,
    },
    // 詳細リスト
    expiringList: expiring,
    expiredList: expired,
  };
}
