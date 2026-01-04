import {
  getBaseRecords,
  createBaseRecord,
  updateBaseRecord,
} from "@/lib/lark-client";
import { LARK_TABLES, EMPLOYEE_FIELDS } from "@/lib/lark-tables";
import { Employee, EmploymentStatus } from "@/types";

/**
 * Peopleフィールドから名前を抽出
 */
function extractNameFromPeopleField(field: any): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (Array.isArray(field) && field[0]?.name) return field[0].name;
  if (typeof field === "object" && field.name) return field.name;
  return String(field);
}

/**
 * Peopleフィールドからメールを抽出
 */
function extractEmailFromPeopleField(field: any): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (Array.isArray(field) && field[0]?.email) return field[0].email;
  if (typeof field === "object" && field.email) return field.email;
  return "";
}

/**
 * 全ての社員を取得
 */
export async function getEmployees(
  includeResigned: boolean = false
): Promise<Employee[]> {
  try {
    const filter = includeResigned
      ? undefined
      : `CurrentValue.[${EMPLOYEE_FIELDS.employment_status}] = "active"`;

    const response = await getBaseRecords(LARK_TABLES.EMPLOYEES, {
      filter,
    });

    if (!response.data?.items) {
      return [];
    }

    const employees: Employee[] = response.data.items.map((item: any) => ({
      employee_id: String(item.fields[EMPLOYEE_FIELDS.employee_id] || ""),
      employee_name: extractNameFromPeopleField(item.fields[EMPLOYEE_FIELDS.employee_name]),
      email: extractEmailFromPeopleField(item.fields[EMPLOYEE_FIELDS.employee_name]) || String(item.fields[EMPLOYEE_FIELDS.email] || ""),
      department: String(item.fields[EMPLOYEE_FIELDS.department] || ""),
      role: (item.fields[EMPLOYEE_FIELDS.role] || "applicant") as any,
      employment_status: (item.fields[EMPLOYEE_FIELDS.employment_status] ||
        "active") as EmploymentStatus,
      hire_date: new Date(
        Number(item.fields[EMPLOYEE_FIELDS.hire_date]) || Date.now()
      ),
      resignation_date: item.fields[EMPLOYEE_FIELDS.resignation_date]
        ? new Date(Number(item.fields[EMPLOYEE_FIELDS.resignation_date]))
        : undefined,
      created_at: new Date(
        Number(item.fields[EMPLOYEE_FIELDS.created_at]) || Date.now()
      ),
      updated_at: new Date(
        Number(item.fields[EMPLOYEE_FIELDS.updated_at]) || Date.now()
      ),
    }));

    return employees;
  } catch (error) {
    console.error("Failed to get employees:", error);
    return [];
  }
}

/**
 * 特定の社員を取得
 */
export async function getEmployee(employeeId: string): Promise<Employee | null> {
  try {
    const filter = `CurrentValue.[${EMPLOYEE_FIELDS.employee_id}] = "${employeeId}"`;

    const response = await getBaseRecords(LARK_TABLES.EMPLOYEES, {
      filter,
    });

    if (!response.data?.items || response.data.items.length === 0) {
      return null;
    }

    const item = response.data.items[0];
    return {
      employee_id: String(item.fields[EMPLOYEE_FIELDS.employee_id] || ""),
      employee_name: extractNameFromPeopleField(item.fields[EMPLOYEE_FIELDS.employee_name]),
      email: extractEmailFromPeopleField(item.fields[EMPLOYEE_FIELDS.employee_name]) || String(item.fields[EMPLOYEE_FIELDS.email] || ""),
      department: String(item.fields[EMPLOYEE_FIELDS.department] || ""),
      role: (item.fields[EMPLOYEE_FIELDS.role] || "applicant") as any,
      employment_status: (item.fields[EMPLOYEE_FIELDS.employment_status] ||
        "active") as EmploymentStatus,
      hire_date: new Date(
        Number(item.fields[EMPLOYEE_FIELDS.hire_date]) || Date.now()
      ),
      resignation_date: item.fields[EMPLOYEE_FIELDS.resignation_date]
        ? new Date(Number(item.fields[EMPLOYEE_FIELDS.resignation_date]))
        : undefined,
      created_at: new Date(
        Number(item.fields[EMPLOYEE_FIELDS.created_at]) || Date.now()
      ),
      updated_at: new Date(
        Number(item.fields[EMPLOYEE_FIELDS.updated_at]) || Date.now()
      ),
    };
  } catch (error) {
    console.error("Failed to get employee:", error);
    return null;
  }
}

/**
 * メールアドレスで社員を取得
 */
export async function getEmployeeByEmail(email: string): Promise<Employee | null> {
  try {
    const filter = `CurrentValue.[${EMPLOYEE_FIELDS.email}] = "${email}"`;

    const response = await getBaseRecords(LARK_TABLES.EMPLOYEES, {
      filter,
    });

    if (!response.data?.items || response.data.items.length === 0) {
      return null;
    }

    const item = response.data.items[0];
    return {
      employee_id: String(item.fields[EMPLOYEE_FIELDS.employee_id] || ""),
      employee_name: extractNameFromPeopleField(item.fields[EMPLOYEE_FIELDS.employee_name]),
      email: extractEmailFromPeopleField(item.fields[EMPLOYEE_FIELDS.employee_name]) || String(item.fields[EMPLOYEE_FIELDS.email] || ""),
      department: String(item.fields[EMPLOYEE_FIELDS.department] || ""),
      role: (item.fields[EMPLOYEE_FIELDS.role] || "applicant") as any,
      employment_status: (item.fields[EMPLOYEE_FIELDS.employment_status] ||
        "active") as EmploymentStatus,
      hire_date: new Date(
        Number(item.fields[EMPLOYEE_FIELDS.hire_date]) || Date.now()
      ),
      resignation_date: item.fields[EMPLOYEE_FIELDS.resignation_date]
        ? new Date(Number(item.fields[EMPLOYEE_FIELDS.resignation_date]))
        : undefined,
      created_at: new Date(
        Number(item.fields[EMPLOYEE_FIELDS.created_at]) || Date.now()
      ),
      updated_at: new Date(
        Number(item.fields[EMPLOYEE_FIELDS.updated_at]) || Date.now()
      ),
    };
  } catch (error) {
    console.error("Failed to get employee by email:", error);
    return null;
  }
}

/**
 * 社員を退職させる（論理削除）
 */
export async function retireEmployee(
  employeeId: string,
  resignationDate?: Date
): Promise<void> {
  try {
    const filter = `CurrentValue.[${EMPLOYEE_FIELDS.employee_id}] = "${employeeId}"`;

    const response = await getBaseRecords(LARK_TABLES.EMPLOYEES, {
      filter,
    });

    if (!response.data?.items || response.data.items.length === 0) {
      throw new Error("Employee not found");
    }

    const recordId = response.data.items[0].record_id || "";
    const actualResignationDate = resignationDate || new Date();

    await updateBaseRecord(LARK_TABLES.EMPLOYEES, recordId, {
      [EMPLOYEE_FIELDS.employment_status]: "resigned",
      [EMPLOYEE_FIELDS.resignation_date]: actualResignationDate.getTime(),
      [EMPLOYEE_FIELDS.updated_at]: Date.now(),
    });

    console.log(`Employee ${employeeId} retired on ${actualResignationDate}`);
  } catch (error) {
    console.error("Failed to retire employee:", error);
    throw error;
  }
}

/**
 * 社員の退職に伴い、関連書類を論理削除
 */
export async function softDeleteEmployeeDocuments(
  employeeId: string
): Promise<{
  licensesDeleted: number;
  vehiclesDeleted: number;
  insurancesDeleted: number;
}> {
  try {
    const deleteFilter = `AND(
      CurrentValue.[employee_id] = "${employeeId}",
      CurrentValue.[deleted_flag] = false
    )`;

    // 3つのテーブルから並列でデータ取得
    const [licensesResponse, vehiclesResponse, insurancesResponse] =
      await Promise.all([
        getBaseRecords(LARK_TABLES.DRIVERS_LICENSES, { filter: deleteFilter }),
        getBaseRecords(LARK_TABLES.VEHICLE_REGISTRATIONS, { filter: deleteFilter }),
        getBaseRecords(LARK_TABLES.INSURANCE_POLICIES, { filter: deleteFilter }),
      ]);

    const now = Date.now();
    const deleteData = {
      deleted_flag: true,
      deleted_at: now,
      updated_at: now,
    };

    // 全ての更新処理を並列で実行
    const updatePromises: Promise<any>[] = [];

    // 免許証の論理削除
    const licenseItems = licensesResponse.data?.items || [];
    for (const item of licenseItems) {
      updatePromises.push(
        updateBaseRecord(LARK_TABLES.DRIVERS_LICENSES, item.record_id || "", deleteData)
      );
    }

    // 車検証の論理削除
    const vehicleItems = vehiclesResponse.data?.items || [];
    for (const item of vehicleItems) {
      updatePromises.push(
        updateBaseRecord(LARK_TABLES.VEHICLE_REGISTRATIONS, item.record_id || "", deleteData)
      );
    }

    // 任意保険の論理削除
    const insuranceItems = insurancesResponse.data?.items || [];
    for (const item of insuranceItems) {
      updatePromises.push(
        updateBaseRecord(LARK_TABLES.INSURANCE_POLICIES, item.record_id || "", deleteData)
      );
    }

    // 全ての更新を並列実行
    await Promise.all(updatePromises);

    const licensesDeleted = licenseItems.length;
    const vehiclesDeleted = vehicleItems.length;
    const insurancesDeleted = insuranceItems.length;

    console.log(
      `Soft deleted documents for employee ${employeeId}: ${licensesDeleted} licenses, ${vehiclesDeleted} vehicles, ${insurancesDeleted} insurances`
    );

    return { licensesDeleted, vehiclesDeleted, insurancesDeleted };
  } catch (error) {
    console.error("Failed to soft delete employee documents:", error);
    throw error;
  }
}

/**
 * 社員を退職させ、関連書類も論理削除
 */
export async function retireEmployeeWithDocuments(
  employeeId: string,
  resignationDate?: Date
): Promise<{
  employee: boolean;
  documents: {
    licensesDeleted: number;
    vehiclesDeleted: number;
    insurancesDeleted: number;
  };
}> {
  try {
    // 社員を退職状態にする
    await retireEmployee(employeeId, resignationDate);

    // 関連書類を論理削除
    const documents = await softDeleteEmployeeDocuments(employeeId);

    return {
      employee: true,
      documents,
    };
  } catch (error) {
    console.error("Failed to retire employee with documents:", error);
    throw error;
  }
}

/**
 * 社員を復職させる
 */
export async function reactivateEmployee(employeeId: string): Promise<void> {
  try {
    const filter = `CurrentValue.[${EMPLOYEE_FIELDS.employee_id}] = "${employeeId}"`;

    const response = await getBaseRecords(LARK_TABLES.EMPLOYEES, {
      filter,
    });

    if (!response.data?.items || response.data.items.length === 0) {
      throw new Error("Employee not found");
    }

    const recordId = response.data.items[0].record_id || "";

    await updateBaseRecord(LARK_TABLES.EMPLOYEES, recordId, {
      [EMPLOYEE_FIELDS.employment_status]: "active",
      [EMPLOYEE_FIELDS.resignation_date]: null,
      [EMPLOYEE_FIELDS.updated_at]: Date.now(),
    });

    console.log(`Employee ${employeeId} reactivated`);
  } catch (error) {
    console.error("Failed to reactivate employee:", error);
    throw error;
  }
}
