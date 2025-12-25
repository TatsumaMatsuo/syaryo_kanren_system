import { ApplicationOverview, DriversLicense, VehicleRegistration, InsurancePolicy } from "@/types";
import { getBaseRecords } from "@/lib/lark-client";
import { LARK_TABLES, EMPLOYEE_FIELDS } from "@/lib/lark-tables";

/**
 * 統合ビュー: 社員の申請情報を3テーブル結合で取得
 * 1:多対応: vehicles, insurances は配列で返す
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
            ? `CurrentValue.[employee_id]="${employeeId}"`
            : undefined,
        }),
        getBaseRecords(LARK_TABLES.VEHICLE_REGISTRATIONS, {
          filter: employeeId
            ? `CurrentValue.[employee_id]="${employeeId}"`
            : undefined,
        }),
        getBaseRecords(LARK_TABLES.INSURANCE_POLICIES, {
          filter: employeeId
            ? `CurrentValue.[employee_id]="${employeeId}"`
            : undefined,
        }),
        getBaseRecords(LARK_TABLES.EMPLOYEES, {
          filter: employeeId
            ? `CurrentValue.[${EMPLOYEE_FIELDS.employee_id}]="${employeeId}"`
            : undefined,
        }),
      ]);

    // 免許証: 1:1なのでMapでOK（最初の1件を使用）
    const licensesMap = new Map<string, DriversLicense>();
    licensesResponse.data?.items
      ?.filter((item: any) => item.fields.deleted_flag === false)
      ?.forEach((item: any) => {
        const empId = item.fields.employee_id;
        // 1:1なので最初の1件だけ保存
        if (!licensesMap.has(empId)) {
          licensesMap.set(empId, {
            id: item.record_id,
            employee_id: item.fields.employee_id,
            license_number: item.fields.license_number,
            license_type: item.fields.license_type,
            issue_date: item.fields.issue_date ? new Date(item.fields.issue_date) : undefined,
            expiration_date: item.fields.expiration_date ? new Date(item.fields.expiration_date) : undefined,
            image_url: item.fields.image_url,
            status: item.fields.status,
            approval_status: item.fields.approval_status,
            rejection_reason: item.fields.rejection_reason,
            created_at: item.fields.created_at ? new Date(item.fields.created_at) : undefined,
            updated_at: item.fields.updated_at ? new Date(item.fields.updated_at) : undefined,
            deleted_flag: false,
          } as DriversLicense);
        }
      });

    // 車検証: 1:多なので配列でグループ化
    const vehiclesMap = new Map<string, VehicleRegistration[]>();
    vehiclesResponse.data?.items
      ?.filter((item: any) => item.fields.deleted_flag === false)
      ?.forEach((item: any) => {
        const empId = item.fields.employee_id;
        const vehicle: VehicleRegistration = {
          id: item.record_id,
          employee_id: item.fields.employee_id,
          vehicle_number: item.fields.vehicle_number,
          vehicle_type: item.fields.vehicle_type,
          manufacturer: item.fields.manufacturer,
          model_name: item.fields.model_name,
          inspection_expiration_date: item.fields.expiration_date ? new Date(item.fields.expiration_date) : undefined,
          owner_name: item.fields.owner_name,
          image_url: item.fields.image_url,
          status: item.fields.status,
          approval_status: item.fields.approval_status,
          rejection_reason: item.fields.rejection_reason,
          created_at: item.fields.created_at ? new Date(item.fields.created_at) : undefined,
          updated_at: item.fields.updated_at ? new Date(item.fields.updated_at) : undefined,
          deleted_flag: false,
        } as VehicleRegistration;

        if (!vehiclesMap.has(empId)) {
          vehiclesMap.set(empId, []);
        }
        vehiclesMap.get(empId)!.push(vehicle);
      });

    // 保険証: 1:多なので配列でグループ化
    const insurancesMap = new Map<string, InsurancePolicy[]>();
    insurancesResponse.data?.items
      ?.filter((item: any) => item.fields.deleted_flag === false)
      ?.forEach((item: any) => {
        const empId = item.fields.employee_id;
        const insurance: InsurancePolicy = {
          id: item.record_id,
          employee_id: item.fields.employee_id,
          policy_number: item.fields.policy_number,
          insurance_company: item.fields.insurance_company,
          policy_type: item.fields.policy_type,
          coverage_start_date: item.fields.coverage_start_date ? new Date(item.fields.coverage_start_date) : undefined,
          coverage_end_date: item.fields.coverage_end_date ? new Date(item.fields.coverage_end_date) : undefined,
          insured_amount: item.fields.insured_amount,
          // 補償内容フィールド（会社規定チェック用）
          liability_personal_unlimited: item.fields.liability_personal_unlimited || false,
          liability_property_amount: item.fields.liability_property_amount || 0,
          passenger_injury_amount: item.fields.passenger_injury_amount || 0,
          image_url: item.fields.image_url,
          status: item.fields.status,
          approval_status: item.fields.approval_status,
          rejection_reason: item.fields.rejection_reason,
          created_at: item.fields.created_at ? new Date(item.fields.created_at) : undefined,
          updated_at: item.fields.updated_at ? new Date(item.fields.updated_at) : undefined,
          deleted_flag: false,
        } as InsurancePolicy;

        if (!insurancesMap.has(empId)) {
          insurancesMap.set(empId, []);
        }
        insurancesMap.get(empId)!.push(insurance);
      });

    // 社員マスタを基準に結合
    // 社員マスタのフィールド名は日本語（社員コード、社員名など）
    console.log('DEBUG: Employees count:', employeesResponse.data?.items?.length || 0);
    console.log('DEBUG: Licenses count:', licensesResponse.data?.items?.length || 0);
    console.log('DEBUG: Vehicles count:', vehiclesResponse.data?.items?.length || 0);
    console.log('DEBUG: Insurances count:', insurancesResponse.data?.items?.length || 0);

    const overviewsRaw =
      employeesResponse.data?.items
        ?.map((item: any): ApplicationOverview | null => {
          // 社員マスタのフィールド名（日本語）からemployee_idを取得
          const empId = item.fields[EMPLOYEE_FIELDS.employee_id] || item.fields.employee_id;

          // 社員名フィールド（Peopleフィールドの場合はオブジェクト/配列から名前を抽出）
          const nameField = item.fields[EMPLOYEE_FIELDS.employee_name] || item.fields["社員名"] || item.fields.name;
          let empName = "不明";
          if (typeof nameField === "string") {
            empName = nameField;
          } else if (Array.isArray(nameField) && nameField[0]?.name) {
            empName = nameField[0].name;
          } else if (nameField && typeof nameField === "object" && nameField.name) {
            empName = nameField.name;
          }

          // メンバーフィールドからメール・部署を取得
          const memberField = item.fields[EMPLOYEE_FIELDS.employee_name];
          let email = item.fields[EMPLOYEE_FIELDS.email] || item.fields.email || "";
          if (!email && Array.isArray(memberField) && memberField[0]?.email) {
            email = memberField[0].email;
          } else if (!email && memberField && typeof memberField === "object" && memberField.email) {
            email = memberField.email;
          }

          let department = "";
          const deptField = item.fields[EMPLOYEE_FIELDS.department];
          if (Array.isArray(deptField)) {
            department = deptField.join(", ");
          } else if (typeof deptField === "string") {
            department = deptField;
          } else if (Array.isArray(memberField) && memberField[0]?.department_ids) {
            department = memberField[0].department_ids.join(", ");
          } else {
            department = item.fields.department || "";
          }

          const license = licensesMap.get(empId) || null;
          const vehicles = vehiclesMap.get(empId) || [];
          const insurances = insurancesMap.get(empId) || [];

          console.log(`DEBUG: Employee ${empId} (${empName}):`, {
            hasLicense: !!license,
            vehicleCount: vehicles.length,
            insuranceCount: insurances.length,
          });

          // いずれかの書類がある場合のみ返す
          if (!license && vehicles.length === 0 && insurances.length === 0) {
            console.log(`DEBUG: Skipping employee ${empId} - no documents`);
            return null;
          }

          return {
            employee: {
              employee_id: empId,
              employee_name: empName,
              email: email,
              department: department,
              role: item.fields.role || "applicant",
              employment_status: item.fields["退職者フラグ"] ? "resigned" : "active",
              hire_date: item.fields.hire_date ? new Date(item.fields.hire_date) : undefined,
              resignation_date: item.fields.resignation_date
                ? new Date(item.fields.resignation_date)
                : undefined,
              created_at: item.fields.created_at ? new Date(item.fields.created_at) : undefined,
              updated_at: item.fields.updated_at ? new Date(item.fields.updated_at) : undefined,
            },
            license,
            vehicles,
            insurances,
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
    return overviews.filter((overview) => {
      // 免許証がpending
      const licensePending = overview.license?.approval_status === "pending";
      // 車検証のいずれかがpending
      const vehiclePending = overview.vehicles.some(v => v.approval_status === "pending");
      // 保険証のいずれかがpending
      const insurancePending = overview.insurances.some(i => i.approval_status === "pending");

      return licensePending || vehiclePending || insurancePending;
    });
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
    return overviews.filter((overview) => {
      // 免許証が承認済み
      const licenseApproved = overview.license?.approval_status === "approved";
      // 車検証がすべて承認済み（1件以上必須）
      const vehiclesApproved = overview.vehicles.length > 0 &&
        overview.vehicles.every(v => v.approval_status === "approved");
      // 保険証がすべて承認済み（1件以上必須）
      const insurancesApproved = overview.insurances.length > 0 &&
        overview.insurances.every(i => i.approval_status === "approved");

      return licenseApproved && vehiclesApproved && insurancesApproved;
    });
  } catch (error) {
    console.error("Error fetching approved applications:", error);
    throw error;
  }
}
