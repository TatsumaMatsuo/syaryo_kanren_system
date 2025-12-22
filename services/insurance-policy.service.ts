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
      ? `AND(CurrentValue.[deleted_flag]=false, CurrentValue.[employee_id]="${employeeId}")`
      : `CurrentValue.[deleted_flag]=false`;

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
      [INSURANCE_POLICY_FIELDS.coverage_start_date]: data.coverage_start_date.toISOString(),
      [INSURANCE_POLICY_FIELDS.coverage_end_date]: data.coverage_end_date.toISOString(),
      [INSURANCE_POLICY_FIELDS.insured_amount]: data.insured_amount || 0,
      [INSURANCE_POLICY_FIELDS.image_url]: data.image_url,
      [INSURANCE_POLICY_FIELDS.status]: data.status,
      [INSURANCE_POLICY_FIELDS.approval_status]: data.approval_status,
      [INSURANCE_POLICY_FIELDS.rejection_reason]: data.rejection_reason || "",
      [INSURANCE_POLICY_FIELDS.created_at]: new Date().toISOString(),
      [INSURANCE_POLICY_FIELDS.updated_at]: new Date().toISOString(),
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
    const fields: Record<string, any> = {
      [INSURANCE_POLICY_FIELDS.updated_at]: new Date().toISOString(),
    };

    if (data.policy_number)
      fields[INSURANCE_POLICY_FIELDS.policy_number] = data.policy_number;
    if (data.insurance_company)
      fields[INSURANCE_POLICY_FIELDS.insurance_company] = data.insurance_company;
    if (data.policy_type) fields[INSURANCE_POLICY_FIELDS.policy_type] = data.policy_type;
    if (data.coverage_start_date)
      fields[INSURANCE_POLICY_FIELDS.coverage_start_date] =
        data.coverage_start_date.toISOString();
    if (data.coverage_end_date)
      fields[INSURANCE_POLICY_FIELDS.coverage_end_date] = data.coverage_end_date.toISOString();
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
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const today = new Date();

    const filter = `AND(
      CurrentValue.[deleted_flag]=false,
      CurrentValue.[status]="approved",
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
    const today = new Date();

    const filter = `AND(
      CurrentValue.[deleted_flag]=false,
      CurrentValue.[status]="approved",
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
