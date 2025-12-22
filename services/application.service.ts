import { ApplicationOverview } from "@/types";
import { getDriversLicenses } from "./drivers-license.service";
import { getBaseRecords } from "@/lib/lark-client";
import { LARK_TABLES } from "@/lib/lark-tables";

/**
 * 統合ビュー: 社員の申請情報を3テーブル結合で取得
 */
export async function getApplicationOverview(
  employeeId?: string
): Promise<ApplicationOverview[]> {
  try {
    // 各テーブルからデータを取得
    const [licensesResponse, vehiclesResponse, insurancesResponse, employeesResponse] =
      await Promise.all([
        getBaseRecords(LARK_TABLES.DRIVERS_LICENSES, {
          filter: employeeId
            ? `AND(CurrentValue.[deleted_flag]=false, CurrentValue.[employee_id]="${employeeId}")`
            : `CurrentValue.[deleted_flag]=false`,
        }),
        getBaseRecords(LARK_TABLES.VEHICLE_REGISTRATIONS, {
          filter: employeeId
            ? `AND(CurrentValue.[deleted_flag]=false, CurrentValue.[employee_id]="${employeeId}")`
            : `CurrentValue.[deleted_flag]=false`,
        }),
        getBaseRecords(LARK_TABLES.INSURANCE_POLICIES, {
          filter: employeeId
            ? `AND(CurrentValue.[deleted_flag]=false, CurrentValue.[employee_id]="${employeeId}")`
            : `CurrentValue.[deleted_flag]=false`,
        }),
        getBaseRecords(LARK_TABLES.EMPLOYEES, {
          filter: employeeId
            ? `CurrentValue.[employee_id]="${employeeId}"`
            : `CurrentValue.[employment_status]="active"`,
        }),
      ]);

    // データをマップに変換
    const licensesMap = new Map(
      licensesResponse.data?.items?.map((item: any) => [
        item.fields.employee_id,
        {
          id: item.record_id,
          employee_id: item.fields.employee_id,
          license_number: item.fields.license_number,
          license_type: item.fields.license_type,
          issue_date: new Date(item.fields.issue_date),
          expiration_date: new Date(item.fields.expiration_date),
          image_url: item.fields.image_url,
          status: item.fields.status,
          approval_status: item.fields.approval_status,
          rejection_reason: item.fields.rejection_reason,
          created_at: new Date(item.fields.created_at),
          updated_at: new Date(item.fields.updated_at),
          deleted_flag: false,
        },
      ]) || []
    );

    const vehiclesMap = new Map(
      vehiclesResponse.data?.items?.map((item: any) => [
        item.fields.employee_id,
        {
          id: item.record_id,
          employee_id: item.fields.employee_id,
          vehicle_number: item.fields.vehicle_number,
          vehicle_type: item.fields.vehicle_type,
          manufacturer: item.fields.manufacturer,
          model_name: item.fields.model_name,
          inspection_expiration_date: new Date(item.fields.inspection_expiration_date),
          owner_name: item.fields.owner_name,
          image_url: item.fields.image_url,
          status: item.fields.status,
          approval_status: item.fields.approval_status,
          rejection_reason: item.fields.rejection_reason,
          created_at: new Date(item.fields.created_at),
          updated_at: new Date(item.fields.updated_at),
          deleted_flag: false,
        },
      ]) || []
    );

    const insurancesMap = new Map(
      insurancesResponse.data?.items?.map((item: any) => [
        item.fields.employee_id,
        {
          id: item.record_id,
          employee_id: item.fields.employee_id,
          policy_number: item.fields.policy_number,
          insurance_company: item.fields.insurance_company,
          policy_type: item.fields.policy_type,
          coverage_start_date: new Date(item.fields.coverage_start_date),
          coverage_end_date: new Date(item.fields.coverage_end_date),
          insured_amount: item.fields.insured_amount,
          image_url: item.fields.image_url,
          status: item.fields.status,
          approval_status: item.fields.approval_status,
          rejection_reason: item.fields.rejection_reason,
          created_at: new Date(item.fields.created_at),
          updated_at: new Date(item.fields.updated_at),
          deleted_flag: false,
        },
      ]) || []
    );

    // 社員マスタを基準に結合
    const overviewsRaw =
      employeesResponse.data?.items
        ?.map((item: any): ApplicationOverview | null => {
          const empId = item.fields.employee_id;
          const license = licensesMap.get(empId);
          const vehicle = vehiclesMap.get(empId);
          const insurance = insurancesMap.get(empId);

          // 3つすべてが揃っている場合のみ返す
          if (!license || !vehicle || !insurance) {
            return null;
          }

          return {
            employee: {
              employee_id: item.fields.employee_id,
              employee_name: item.fields.employee_name,
              email: item.fields.email,
              department: item.fields.department,
              role: item.fields.role,
              employment_status: item.fields.employment_status,
              hire_date: new Date(item.fields.hire_date),
              resignation_date: item.fields.resignation_date
                ? new Date(item.fields.resignation_date)
                : undefined,
              created_at: new Date(item.fields.created_at),
              updated_at: new Date(item.fields.updated_at),
            },
            license,
            vehicle,
            insurance,
          };
        }) || [];

    const overviews: ApplicationOverview[] = overviewsRaw.filter(
      (item): item is ApplicationOverview => item !== null
    );

    return overviews;
  } catch (error) {
    console.error("Error fetching application overview:", error);
    throw error;
  }
}

/**
 * 承認待ちの申請一覧を取得
 */
export async function getPendingApplications(): Promise<ApplicationOverview[]> {
  try {
    const overviews = await getApplicationOverview();

    // 承認待ち（いずれか1つでもpending）の申請のみフィルタ
    return overviews.filter(
      (overview) =>
        overview.license.approval_status === "pending" ||
        overview.vehicle.approval_status === "pending" ||
        overview.insurance.approval_status === "pending"
    );
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    throw error;
  }
}

/**
 * 全て承認済みの申請一覧を取得
 */
export async function getApprovedApplications(): Promise<ApplicationOverview[]> {
  try {
    const overviews = await getApplicationOverview();

    // 全て承認済みの申請のみフィルタ
    return overviews.filter(
      (overview) =>
        overview.license.approval_status === "approved" &&
        overview.vehicle.approval_status === "approved" &&
        overview.insurance.approval_status === "approved"
    );
  } catch (error) {
    console.error("Error fetching approved applications:", error);
    throw error;
  }
}
