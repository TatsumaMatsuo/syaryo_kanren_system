import { createBaseRecord, getBaseRecords } from "@/lib/lark-client";
import { LARK_TABLES, APPROVAL_HISTORY_FIELDS } from "@/lib/lark-tables";

/**
 * Peopleフィールドや文字列から名前を抽出
 */
function extractName(field: any): string {
  if (!field) return "";
  if (typeof field === "string") {
    if (field === "[object Object]") return "";
    return field;
  }
  if (Array.isArray(field) && field[0]?.name) return field[0].name;
  if (typeof field === "object" && field.name) return field.name;
  return "";
}

export type ApplicationType = "license" | "vehicle" | "insurance";
export type ApprovalAction = "approved" | "rejected";

export interface ApprovalHistoryRecord {
  id?: string;
  application_type: ApplicationType;
  application_id: string;
  employee_id: string;
  employee_name: string;
  action: ApprovalAction;
  approver_id: string;
  approver_name: string;
  reason?: string;
  timestamp: number;
  created_at?: number;
}

export interface ApprovalHistoryFilter {
  application_type?: ApplicationType;
  employee_id?: string;
  approver_id?: string;
  action?: ApprovalAction;
  from_date?: Date;
  to_date?: Date;
}

/**
 * 承認履歴を記録
 */
export async function recordApprovalHistory(
  record: Omit<ApprovalHistoryRecord, "id" | "created_at">
): Promise<boolean> {
  try {
    const now = Date.now();

    await createBaseRecord(LARK_TABLES.APPROVAL_HISTORY, {
      [APPROVAL_HISTORY_FIELDS.application_type]: record.application_type,
      [APPROVAL_HISTORY_FIELDS.application_id]: record.application_id,
      [APPROVAL_HISTORY_FIELDS.employee_id]: record.employee_id,
      [APPROVAL_HISTORY_FIELDS.employee_name]: record.employee_name,
      [APPROVAL_HISTORY_FIELDS.action]: record.action,
      [APPROVAL_HISTORY_FIELDS.approver_id]: record.approver_id,
      [APPROVAL_HISTORY_FIELDS.approver_name]: record.approver_name,
      [APPROVAL_HISTORY_FIELDS.reason]: record.reason || "",
      [APPROVAL_HISTORY_FIELDS.timestamp]: record.timestamp,
      [APPROVAL_HISTORY_FIELDS.created_at]: now,
    });

    console.log(
      `[Approval History] Recorded: ${record.action} - ${record.application_type} by ${record.approver_name}`
    );

    return true;
  } catch (error) {
    console.error("[Approval History] Failed to record:", error);
    return false;
  }
}

/**
 * 承認履歴を取得
 */
export async function getApprovalHistory(
  filter?: ApprovalHistoryFilter
): Promise<ApprovalHistoryRecord[]> {
  try {
    // フィルター条件を構築
    const filterConditions: string[] = [];

    if (filter?.application_type) {
      filterConditions.push(
        `CurrentValue.[${APPROVAL_HISTORY_FIELDS.application_type}] = "${filter.application_type}"`
      );
    }

    if (filter?.employee_id) {
      filterConditions.push(
        `CurrentValue.[${APPROVAL_HISTORY_FIELDS.employee_id}] = "${filter.employee_id}"`
      );
    }

    if (filter?.approver_id) {
      filterConditions.push(
        `CurrentValue.[${APPROVAL_HISTORY_FIELDS.approver_id}] = "${filter.approver_id}"`
      );
    }

    if (filter?.action) {
      filterConditions.push(
        `CurrentValue.[${APPROVAL_HISTORY_FIELDS.action}] = "${filter.action}"`
      );
    }

    const filterFormula =
      filterConditions.length > 0
        ? `AND(${filterConditions.join(", ")})`
        : undefined;

    console.log("[Approval History] Fetching with filter:", filterFormula);
    console.log("[Approval History] Table ID:", LARK_TABLES.APPROVAL_HISTORY);

    // ソートを削除（InvalidSortエラー回避）
    const response = await getBaseRecords(LARK_TABLES.APPROVAL_HISTORY, {
      filter: filterFormula,
    });

    console.log("[Approval History] Response items count:", response.data?.items?.length || 0);

    if (!response.data?.items) {
      return [];
    }

    const records = response.data.items.map((item: any) => ({
      id: item.record_id,
      application_type: item.fields[APPROVAL_HISTORY_FIELDS.application_type] || "",
      application_id: item.fields[APPROVAL_HISTORY_FIELDS.application_id] || "",
      employee_id: item.fields[APPROVAL_HISTORY_FIELDS.employee_id] || "",
      employee_name: extractName(item.fields[APPROVAL_HISTORY_FIELDS.employee_name]),
      action: item.fields[APPROVAL_HISTORY_FIELDS.action] || "",
      approver_id: item.fields[APPROVAL_HISTORY_FIELDS.approver_id] || "",
      approver_name: extractName(item.fields[APPROVAL_HISTORY_FIELDS.approver_name]),
      reason: item.fields[APPROVAL_HISTORY_FIELDS.reason] || "",
      timestamp: item.fields[APPROVAL_HISTORY_FIELDS.timestamp],
      created_at: item.fields[APPROVAL_HISTORY_FIELDS.created_at],
    }));

    // 名前が空の場合、社員マスタから取得
    const { getEmployee } = await import("./employee.service");
    for (const record of records) {
      if (!record.employee_name && record.employee_id) {
        const employee = await getEmployee(record.employee_id);
        if (employee) {
          record.employee_name = employee.employee_name;
        }
      }
    }

    return records;
  } catch (error) {
    console.error("[Approval History] Failed to get history:", error);
    return [];
  }
}

/**
 * 申請タイプの日本語名を取得
 */
export function getApplicationTypeName(type: ApplicationType): string {
  const typeNames: Record<ApplicationType, string> = {
    license: "免許証",
    vehicle: "車検証",
    insurance: "任意保険証",
  };
  return typeNames[type] || type;
}

/**
 * アクションの日本語名を取得
 */
export function getActionName(action: ApprovalAction): string {
  const actionNames: Record<ApprovalAction, string> = {
    approved: "承認",
    rejected: "却下",
  };
  return actionNames[action] || action;
}

/**
 * 特定の社員の承認履歴を取得
 */
export async function getApprovalHistoryByEmployee(
  employeeId: string
): Promise<ApprovalHistoryRecord[]> {
  return getApprovalHistory({ employee_id: employeeId });
}
