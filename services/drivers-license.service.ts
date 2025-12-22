import { DriversLicense } from "@/types";
import {
  getBaseRecords,
  createBaseRecord,
  updateBaseRecord,
  deleteBaseRecord,
} from "@/lib/lark-client";
import { LARK_TABLES, DRIVERS_LICENSE_FIELDS } from "@/lib/lark-tables";

/**
 * 免許証一覧を取得（削除済みを除外）
 */
export async function getDriversLicenses(employeeId?: string): Promise<DriversLicense[]> {
  try {
    const filter = employeeId
      ? `AND(CurrentValue.[deleted_flag]=false, CurrentValue.[employee_id]="${employeeId}")`
      : `CurrentValue.[deleted_flag]=false`;

    const response = await getBaseRecords(LARK_TABLES.DRIVERS_LICENSES, {
      filter,
    });

    // Lark Baseのレスポンスを型に変換
    const licenses: DriversLicense[] =
      response.data?.items?.map((item: any) => ({
        id: item.record_id,
        employee_id: item.fields[DRIVERS_LICENSE_FIELDS.employee_id],
        license_number: item.fields[DRIVERS_LICENSE_FIELDS.license_number],
        license_type: item.fields[DRIVERS_LICENSE_FIELDS.license_type],
        issue_date: new Date(item.fields[DRIVERS_LICENSE_FIELDS.issue_date]),
        expiration_date: new Date(item.fields[DRIVERS_LICENSE_FIELDS.expiration_date]),
        image_url: item.fields[DRIVERS_LICENSE_FIELDS.image_url],
        status: item.fields[DRIVERS_LICENSE_FIELDS.status],
        approval_status: item.fields[DRIVERS_LICENSE_FIELDS.approval_status],
        rejection_reason: item.fields[DRIVERS_LICENSE_FIELDS.rejection_reason],
        created_at: new Date(item.fields[DRIVERS_LICENSE_FIELDS.created_at]),
        updated_at: new Date(item.fields[DRIVERS_LICENSE_FIELDS.updated_at]),
        deleted_flag: item.fields[DRIVERS_LICENSE_FIELDS.deleted_flag] || false,
        deleted_at: item.fields[DRIVERS_LICENSE_FIELDS.deleted_at]
          ? new Date(item.fields[DRIVERS_LICENSE_FIELDS.deleted_at])
          : undefined,
      })) || [];

    return licenses;
  } catch (error) {
    console.error("Error fetching drivers licenses:", error);
    throw error;
  }
}

/**
 * 免許証を新規作成
 */
export async function createDriversLicense(
  data: Omit<DriversLicense, "id" | "created_at" | "updated_at">
): Promise<DriversLicense> {
  try {
    const fields = {
      [DRIVERS_LICENSE_FIELDS.employee_id]: data.employee_id,
      [DRIVERS_LICENSE_FIELDS.license_number]: data.license_number,
      [DRIVERS_LICENSE_FIELDS.license_type]: data.license_type,
      [DRIVERS_LICENSE_FIELDS.issue_date]: data.issue_date.toISOString(),
      [DRIVERS_LICENSE_FIELDS.expiration_date]: data.expiration_date.toISOString(),
      [DRIVERS_LICENSE_FIELDS.image_url]: data.image_url,
      [DRIVERS_LICENSE_FIELDS.status]: data.status,
      [DRIVERS_LICENSE_FIELDS.approval_status]: data.approval_status,
      [DRIVERS_LICENSE_FIELDS.rejection_reason]: data.rejection_reason || "",
      [DRIVERS_LICENSE_FIELDS.created_at]: new Date().toISOString(),
      [DRIVERS_LICENSE_FIELDS.updated_at]: new Date().toISOString(),
      [DRIVERS_LICENSE_FIELDS.deleted_flag]: false,
    };

    const response = await createBaseRecord(LARK_TABLES.DRIVERS_LICENSES, fields);

    return {
      id: response.data?.record?.record_id || "",
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
  } catch (error) {
    console.error("Error creating drivers license:", error);
    throw error;
  }
}

/**
 * 免許証を更新
 */
export async function updateDriversLicense(
  id: string,
  data: Partial<Omit<DriversLicense, "id" | "created_at">>
): Promise<void> {
  try {
    const fields: Record<string, any> = {
      [DRIVERS_LICENSE_FIELDS.updated_at]: new Date().toISOString(),
    };

    if (data.license_number) fields[DRIVERS_LICENSE_FIELDS.license_number] = data.license_number;
    if (data.license_type) fields[DRIVERS_LICENSE_FIELDS.license_type] = data.license_type;
    if (data.issue_date) fields[DRIVERS_LICENSE_FIELDS.issue_date] = data.issue_date.toISOString();
    if (data.expiration_date)
      fields[DRIVERS_LICENSE_FIELDS.expiration_date] = data.expiration_date.toISOString();
    if (data.image_url) fields[DRIVERS_LICENSE_FIELDS.image_url] = data.image_url;
    if (data.status) fields[DRIVERS_LICENSE_FIELDS.status] = data.status;
    if (data.approval_status)
      fields[DRIVERS_LICENSE_FIELDS.approval_status] = data.approval_status;
    if (data.rejection_reason !== undefined)
      fields[DRIVERS_LICENSE_FIELDS.rejection_reason] = data.rejection_reason;

    await updateBaseRecord(LARK_TABLES.DRIVERS_LICENSES, id, fields);
  } catch (error) {
    console.error("Error updating drivers license:", error);
    throw error;
  }
}

/**
 * 免許証を論理削除
 */
export async function deleteDriversLicense(id: string): Promise<void> {
  try {
    await deleteBaseRecord(LARK_TABLES.DRIVERS_LICENSES, id);
  } catch (error) {
    console.error("Error deleting drivers license:", error);
    throw error;
  }
}

/**
 * 免許証の承認
 */
export async function approveDriversLicense(id: string): Promise<void> {
  try {
    await updateDriversLicense(id, {
      status: "approved",
      approval_status: "approved",
    });
  } catch (error) {
    console.error("Error approving drivers license:", error);
    throw error;
  }
}

/**
 * 免許証の却下
 */
export async function rejectDriversLicense(id: string, reason: string): Promise<void> {
  try {
    await updateDriversLicense(id, {
      approval_status: "rejected",
      rejection_reason: reason,
    });
  } catch (error) {
    console.error("Error rejecting drivers license:", error);
    throw error;
  }
}

/**
 * 有効期限が近い免許証を取得（7日以内）
 */
export async function getExpiringDriversLicenses(): Promise<DriversLicense[]> {
  try {
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const today = new Date();

    const filter = `AND(
      CurrentValue.[deleted_flag]=false,
      CurrentValue.[status]="approved",
      CurrentValue.[expiration_date]>=${today.getTime()},
      CurrentValue.[expiration_date]<=${sevenDaysLater.getTime()}
    )`;

    const response = await getBaseRecords(LARK_TABLES.DRIVERS_LICENSES, {
      filter,
    });

    const licenses: DriversLicense[] =
      response.data?.items?.map((item: any) => ({
        id: item.record_id,
        employee_id: item.fields[DRIVERS_LICENSE_FIELDS.employee_id],
        license_number: item.fields[DRIVERS_LICENSE_FIELDS.license_number],
        license_type: item.fields[DRIVERS_LICENSE_FIELDS.license_type],
        issue_date: new Date(item.fields[DRIVERS_LICENSE_FIELDS.issue_date]),
        expiration_date: new Date(item.fields[DRIVERS_LICENSE_FIELDS.expiration_date]),
        image_url: item.fields[DRIVERS_LICENSE_FIELDS.image_url],
        status: item.fields[DRIVERS_LICENSE_FIELDS.status],
        approval_status: item.fields[DRIVERS_LICENSE_FIELDS.approval_status],
        rejection_reason: item.fields[DRIVERS_LICENSE_FIELDS.rejection_reason],
        created_at: new Date(item.fields[DRIVERS_LICENSE_FIELDS.created_at]),
        updated_at: new Date(item.fields[DRIVERS_LICENSE_FIELDS.updated_at]),
        deleted_flag: false,
      })) || [];

    return licenses;
  } catch (error) {
    console.error("Error fetching expiring drivers licenses:", error);
    throw error;
  }
}
