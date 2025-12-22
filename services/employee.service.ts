import {
  getBaseRecords,
  createBaseRecord,
  updateBaseRecord,
} from "@/lib/lark-client";
import { LARK_TABLES, EMPLOYEE_FIELDS } from "@/lib/lark-tables";
import { Employee, EmploymentStatus } from "@/types";

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
      employee_name: String(item.fields[EMPLOYEE_FIELDS.employee_name] || ""),
      email: String(item.fields[EMPLOYEE_FIELDS.email] || ""),
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
      employee_name: String(item.fields[EMPLOYEE_FIELDS.employee_name] || ""),
      email: String(item.fields[EMPLOYEE_FIELDS.email] || ""),
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
    // 免許証の論理削除
    const licensesResponse = await getBaseRecords(LARK_TABLES.DRIVERS_LICENSES, {
      filter: `AND(
        CurrentValue.[employee_id] = "${employeeId}",
        CurrentValue.[deleted_flag] = false
      )`,
    });

    let licensesDeleted = 0;
    if (licensesResponse.data?.items) {
      for (const item of licensesResponse.data.items) {
        await updateBaseRecord(LARK_TABLES.DRIVERS_LICENSES, item.record_id || "", {
          deleted_flag: true,
          deleted_at: Date.now(),
          updated_at: Date.now(),
        });
        licensesDeleted++;
      }
    }

    // 車検証の論理削除
    const vehiclesResponse = await getBaseRecords(
      LARK_TABLES.VEHICLE_REGISTRATIONS,
      {
        filter: `AND(
        CurrentValue.[employee_id] = "${employeeId}",
        CurrentValue.[deleted_flag] = false
      )`,
      }
    );

    let vehiclesDeleted = 0;
    if (vehiclesResponse.data?.items) {
      for (const item of vehiclesResponse.data.items) {
        await updateBaseRecord(
          LARK_TABLES.VEHICLE_REGISTRATIONS,
          item.record_id || "",
          {
            deleted_flag: true,
            deleted_at: Date.now(),
            updated_at: Date.now(),
          }
        );
        vehiclesDeleted++;
      }
    }

    // 任意保険の論理削除
    const insurancesResponse = await getBaseRecords(
      LARK_TABLES.INSURANCE_POLICIES,
      {
        filter: `AND(
        CurrentValue.[employee_id] = "${employeeId}",
        CurrentValue.[deleted_flag] = false
      )`,
      }
    );

    let insurancesDeleted = 0;
    if (insurancesResponse.data?.items) {
      for (const item of insurancesResponse.data.items) {
        await updateBaseRecord(LARK_TABLES.INSURANCE_POLICIES, item.record_id || "", {
          deleted_flag: true,
          deleted_at: Date.now(),
          updated_at: Date.now(),
        });
        insurancesDeleted++;
      }
    }

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
