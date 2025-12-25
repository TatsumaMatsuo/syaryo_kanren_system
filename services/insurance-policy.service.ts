import { InsurancePolicy } from "@/types";
import {
  getBaseRecords,
  createBaseRecord,
  updateBaseRecord,
  deleteBaseRecord,
} from "@/lib/lark-client";
import { LARK_TABLES, INSURANCE_POLICY_FIELDS } from "@/lib/lark-tables";

/**
 * 任意保険証一覧を取得（削除済みを除外）
 */
export async function getInsurancePolicies(employeeId?: string): Promise<InsurancePolicy[]> {
  try {
    const filter = employeeId
      ? `CurrentValue.[employee_id]="${employeeId}"`
      : undefined;

    const response = await getBaseRecords(LARK_TABLES.INSURANCE_POLICIES, {
      filter,
    });

    // デバッグログ: フィールド名を表示
    console.log(`[insurance-policy] Raw items count: ${response.data?.items?.length || 0}`);
    if (response.data?.items?.[0]) {
      console.log(`[insurance-policy] Available fields:`, Object.keys(response.data.items[0].fields));
    }

    const policies: InsurancePolicy[] =
      response.data?.items
        ?.filter((item: any) => item.fields[INSURANCE_POLICY_FIELDS.deleted_flag] !== true)
        ?.map((item: any) => ({
        id: item.record_id,
        employee_id: item.fields[INSURANCE_POLICY_FIELDS.employee_id],
        policy_number: item.fields[INSURANCE_POLICY_FIELDS.policy_number],
        insurance_company: item.fields[INSURANCE_POLICY_FIELDS.insurance_company],
        policy_type: item.fields[INSURANCE_POLICY_FIELDS.policy_type],
        coverage_start_date: new Date(item.fields[INSURANCE_POLICY_FIELDS.coverage_start_date]),
        coverage_end_date: new Date(item.fields[INSURANCE_POLICY_FIELDS.coverage_end_date]),
        insured_amount: item.fields[INSURANCE_POLICY_FIELDS.insured_amount],
        // 補償内容フィールド
        liability_personal_unlimited: item.fields[INSURANCE_POLICY_FIELDS.liability_personal_unlimited] || false,
        liability_property_amount: item.fields[INSURANCE_POLICY_FIELDS.liability_property_amount] || 0,
        passenger_injury_amount: item.fields[INSURANCE_POLICY_FIELDS.passenger_injury_amount] || 0,
        image_url: item.fields[INSURANCE_POLICY_FIELDS.image_url],
        status: item.fields[INSURANCE_POLICY_FIELDS.status],
        approval_status: item.fields[INSURANCE_POLICY_FIELDS.approval_status],
        rejection_reason: item.fields[INSURANCE_POLICY_FIELDS.rejection_reason],
        created_at: new Date(item.fields[INSURANCE_POLICY_FIELDS.created_at]),
        updated_at: new Date(item.fields[INSURANCE_POLICY_FIELDS.updated_at]),
        deleted_flag: item.fields[INSURANCE_POLICY_FIELDS.deleted_flag] || false,
        deleted_at: item.fields[INSURANCE_POLICY_FIELDS.deleted_at]
          ? new Date(item.fields[INSURANCE_POLICY_FIELDS.deleted_at])
          : undefined,
      })) || [];

    return policies;
  } catch (error) {
    console.error("Error fetching insurance policies:", error);
    throw error;
  }
}

/**
 * 任意保険証を新規作成
 */
export async function createInsurancePolicy(
  data: Omit<InsurancePolicy, "id" | "created_at" | "updated_at">
): Promise<InsurancePolicy> {
  try {
    const fields = {
      [INSURANCE_POLICY_FIELDS.employee_id]: data.employee_id,
      [INSURANCE_POLICY_FIELDS.policy_number]: data.policy_number,
      [INSURANCE_POLICY_FIELDS.insurance_company]: data.insurance_company,
      [INSURANCE_POLICY_FIELDS.policy_type]: data.policy_type,
      [INSURANCE_POLICY_FIELDS.coverage_start_date]: data.coverage_start_date.getTime(),
      [INSURANCE_POLICY_FIELDS.coverage_end_date]: data.coverage_end_date.getTime(),
      [INSURANCE_POLICY_FIELDS.insured_amount]: data.insured_amount || 0,
      // 補償内容フィールド
      [INSURANCE_POLICY_FIELDS.liability_personal_unlimited]: data.liability_personal_unlimited || false,
      [INSURANCE_POLICY_FIELDS.liability_property_amount]: data.liability_property_amount || 0,
      [INSURANCE_POLICY_FIELDS.passenger_injury_amount]: data.passenger_injury_amount || 0,
      [INSURANCE_POLICY_FIELDS.image_url]: data.image_url || "",
      [INSURANCE_POLICY_FIELDS.status]: data.status,
      [INSURANCE_POLICY_FIELDS.approval_status]: data.approval_status,
      [INSURANCE_POLICY_FIELDS.rejection_reason]: data.rejection_reason || "",
      [INSURANCE_POLICY_FIELDS.created_at]: new Date().getTime(),
      [INSURANCE_POLICY_FIELDS.deleted_flag]: false,
    };

    const response = await createBaseRecord(LARK_TABLES.INSURANCE_POLICIES, fields);

    return {
      id: response.data?.record?.record_id || "",
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
  } catch (error) {
    console.error("Error creating insurance policy:", error);
    throw error;
  }
}

/**
 * 任意保険証を更新
 */
export async function updateInsurancePolicy(
  id: string,
  data: Partial<Omit<InsurancePolicy, "id" | "created_at">>
): Promise<void> {
  try {
    const fields: Record<string, any> = {};

    if (data.policy_number)
      fields[INSURANCE_POLICY_FIELDS.policy_number] = data.policy_number;
    if (data.insurance_company)
      fields[INSURANCE_POLICY_FIELDS.insurance_company] = data.insurance_company;
    if (data.policy_type) fields[INSURANCE_POLICY_FIELDS.policy_type] = data.policy_type;
    if (data.coverage_start_date)
      fields[INSURANCE_POLICY_FIELDS.coverage_start_date] = data.coverage_start_date.getTime();
    if (data.coverage_end_date)
      fields[INSURANCE_POLICY_FIELDS.coverage_end_date] = data.coverage_end_date.getTime();
    if (data.insured_amount !== undefined)
      fields[INSURANCE_POLICY_FIELDS.insured_amount] = data.insured_amount;
    if (data.image_url) fields[INSURANCE_POLICY_FIELDS.image_url] = data.image_url;
    if (data.status) fields[INSURANCE_POLICY_FIELDS.status] = data.status;
    if (data.approval_status)
      fields[INSURANCE_POLICY_FIELDS.approval_status] = data.approval_status;
    if (data.rejection_reason !== undefined)
      fields[INSURANCE_POLICY_FIELDS.rejection_reason] = data.rejection_reason;

    await updateBaseRecord(LARK_TABLES.INSURANCE_POLICIES, id, fields);
  } catch (error) {
    console.error("Error updating insurance policy:", error);
    throw error;
  }
}

/**
 * 任意保険証を論理削除
 */
export async function deleteInsurancePolicy(id: string): Promise<void> {
  try {
    await deleteBaseRecord(LARK_TABLES.INSURANCE_POLICIES, id);
  } catch (error) {
    console.error("Error deleting insurance policy:", error);
    throw error;
  }
}

/**
 * 任意保険証の承認
 */
export async function approveInsurancePolicy(id: string): Promise<void> {
  try {
    await updateInsurancePolicy(id, {
      status: "approved",
      approval_status: "approved",
    });
  } catch (error) {
    console.error("Error approving insurance policy:", error);
    throw error;
  }
}

/**
 * 任意保険証の却下
 */
export async function rejectInsurancePolicy(id: string, reason: string): Promise<void> {
  try {
    await updateInsurancePolicy(id, {
      approval_status: "rejected",
      rejection_reason: reason,
    });
  } catch (error) {
    console.error("Error rejecting insurance policy:", error);
    throw error;
  }
}

/**
 * 有効期限が近い任意保険証を取得（7日以内）
 */
export async function getExpiringInsurancePolicies(): Promise<InsurancePolicy[]> {
  try {
    // 今日の日付（0時0分0秒にリセット）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 7日後の終わり（23時59分59秒）
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    sevenDaysLater.setHours(23, 59, 59, 999);

    console.log("[Expiring Insurance] Today:", today.toISOString(), today.getTime());
    console.log("[Expiring Insurance] Seven days later:", sevenDaysLater.toISOString(), sevenDaysLater.getTime());

    // approval_statusも確認（承認フローが完了しているか）
    const filter = `AND(
      CurrentValue.[deleted_flag]=false,
      OR(CurrentValue.[status]="approved", CurrentValue.[approval_status]="approved"),
      CurrentValue.[coverage_end_date]>=${today.getTime()},
      CurrentValue.[coverage_end_date]<=${sevenDaysLater.getTime()}
    )`;

    const response = await getBaseRecords(LARK_TABLES.INSURANCE_POLICIES, {
      filter,
    });

    const policies: InsurancePolicy[] =
      response.data?.items?.map((item: any) => ({
        id: item.record_id,
        employee_id: item.fields[INSURANCE_POLICY_FIELDS.employee_id],
        policy_number: item.fields[INSURANCE_POLICY_FIELDS.policy_number],
        insurance_company: item.fields[INSURANCE_POLICY_FIELDS.insurance_company],
        policy_type: item.fields[INSURANCE_POLICY_FIELDS.policy_type],
        coverage_start_date: new Date(item.fields[INSURANCE_POLICY_FIELDS.coverage_start_date]),
        coverage_end_date: new Date(item.fields[INSURANCE_POLICY_FIELDS.coverage_end_date]),
        insured_amount: item.fields[INSURANCE_POLICY_FIELDS.insured_amount],
        liability_personal_unlimited: item.fields[INSURANCE_POLICY_FIELDS.liability_personal_unlimited] || false,
        liability_property_amount: item.fields[INSURANCE_POLICY_FIELDS.liability_property_amount] || 0,
        passenger_injury_amount: item.fields[INSURANCE_POLICY_FIELDS.passenger_injury_amount] || 0,
        image_url: item.fields[INSURANCE_POLICY_FIELDS.image_url],
        status: item.fields[INSURANCE_POLICY_FIELDS.status],
        approval_status: item.fields[INSURANCE_POLICY_FIELDS.approval_status],
        rejection_reason: item.fields[INSURANCE_POLICY_FIELDS.rejection_reason],
        created_at: new Date(item.fields[INSURANCE_POLICY_FIELDS.created_at]),
        updated_at: new Date(item.fields[INSURANCE_POLICY_FIELDS.updated_at]),
        deleted_flag: false,
      })) || [];

    return policies;
  } catch (error) {
    console.error("Error fetching expiring insurance policies:", error);
    throw error;
  }
}

/**
 * 有効期限切れの任意保険証を取得
 */
export async function getExpiredInsurancePolicies(): Promise<InsurancePolicy[]> {
  try {
    // 今日の日付（0時0分0秒にリセット）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log("[Expired Insurance] Today:", today.toISOString(), today.getTime());

    // approval_statusも確認（承認フローが完了しているか）
    const filter = `AND(
      CurrentValue.[deleted_flag]=false,
      OR(CurrentValue.[status]="approved", CurrentValue.[approval_status]="approved"),
      CurrentValue.[coverage_end_date]<${today.getTime()}
    )`;

    const response = await getBaseRecords(LARK_TABLES.INSURANCE_POLICIES, {
      filter,
    });

    const policies: InsurancePolicy[] =
      response.data?.items?.map((item: any) => ({
        id: item.record_id,
        employee_id: item.fields[INSURANCE_POLICY_FIELDS.employee_id],
        policy_number: item.fields[INSURANCE_POLICY_FIELDS.policy_number],
        insurance_company: item.fields[INSURANCE_POLICY_FIELDS.insurance_company],
        policy_type: item.fields[INSURANCE_POLICY_FIELDS.policy_type],
        coverage_start_date: new Date(item.fields[INSURANCE_POLICY_FIELDS.coverage_start_date]),
        coverage_end_date: new Date(item.fields[INSURANCE_POLICY_FIELDS.coverage_end_date]),
        insured_amount: item.fields[INSURANCE_POLICY_FIELDS.insured_amount],
        liability_personal_unlimited: item.fields[INSURANCE_POLICY_FIELDS.liability_personal_unlimited] || false,
        liability_property_amount: item.fields[INSURANCE_POLICY_FIELDS.liability_property_amount] || 0,
        passenger_injury_amount: item.fields[INSURANCE_POLICY_FIELDS.passenger_injury_amount] || 0,
        image_url: item.fields[INSURANCE_POLICY_FIELDS.image_url],
        status: item.fields[INSURANCE_POLICY_FIELDS.status],
        approval_status: item.fields[INSURANCE_POLICY_FIELDS.approval_status],
        rejection_reason: item.fields[INSURANCE_POLICY_FIELDS.rejection_reason],
        created_at: new Date(item.fields[INSURANCE_POLICY_FIELDS.created_at]),
        updated_at: new Date(item.fields[INSURANCE_POLICY_FIELDS.updated_at]),
        deleted_flag: false,
      })) || [];

    return policies;
  } catch (error) {
    console.error("Error fetching expired insurance policies:", error);
    throw error;
  }
}
