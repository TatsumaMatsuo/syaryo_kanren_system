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
      ? `CurrentValue.[employee_id]="${employeeId}"`
      : undefined;

    const response = await getBaseRecords(LARK_TABLES.DRIVERS_LICENSES, {
      filter,
    });

    // Lark Baseのレスポンスを型に変換（deleted_flag=trueを除外）
    const licenses: DriversLicense[] =
      response.data?.items
        ?.filter((item: any) => item.fields[DRIVERS_LICENSE_FIELDS.deleted_flag] !== true)
        ?.map((item: any) => ({
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
    // テーブルに存在する最小限のフィールドのみを送信
    const fields: Record<string, any> = {
      [DRIVERS_LICENSE_FIELDS.employee_id]: data.employee_id,
      [DRIVERS_LICENSE_FIELDS.license_number]: data.license_number,
      [DRIVERS_LICENSE_FIELDS.license_type]: data.license_type,
      [DRIVERS_LICENSE_FIELDS.expiration_date]: data.expiration_date.getTime(), // Unixタイムスタンプ（ミリ秒）
      [DRIVERS_LICENSE_FIELDS.image_url]: data.image_url || "",
      [DRIVERS_LICENSE_FIELDS.status]: data.status,
      [DRIVERS_LICENSE_FIELDS.approval_status]: data.approval_status,
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
    const fields: Record<string, any> = {};

    if (data.license_number) fields[DRIVERS_LICENSE_FIELDS.license_number] = data.license_number;
    if (data.license_type) fields[DRIVERS_LICENSE_FIELDS.license_type] = data.license_type;
    if (data.issue_date) fields[DRIVERS_LICENSE_FIELDS.issue_date] = data.issue_date.getTime();
    if (data.expiration_date)
      fields[DRIVERS_LICENSE_FIELDS.expiration_date] = data.expiration_date.getTime();
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
    // 今日の日付（0時0分0秒にリセット）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 7日後の終わり（23時59分59秒）
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    sevenDaysLater.setHours(23, 59, 59, 999);

    console.log("[Expiring Licenses] Today:", today.toISOString(), today.getTime());
    console.log("[Expiring Licenses] Seven days later:", sevenDaysLater.toISOString(), sevenDaysLater.getTime());

    // approval_statusも確認（承認フローが完了しているか）
    const filter = `AND(
      CurrentValue.[deleted_flag]=false,
      OR(CurrentValue.[status]="approved", CurrentValue.[approval_status]="approved"),
      CurrentValue.[expiration_date]>=${today.getTime()},
      CurrentValue.[expiration_date]<=${sevenDaysLater.getTime()}
    )`;

    console.log("[Expiring Licenses] Filter:", filter);

    const response = await getBaseRecords(LARK_TABLES.DRIVERS_LICENSES, {
      filter,
    });

    console.log("[Expiring Licenses] Response code:", response.code, "msg:", response.msg);
    console.log("[Expiring Licenses] Items count:", response.data?.items?.length || 0);

    // 全ての免許証を取得して期限を確認（デバッグ用）
    const allLicenses = await getBaseRecords(LARK_TABLES.DRIVERS_LICENSES, {});
    console.log("[Expiring Licenses] All licenses count:", allLicenses.data?.items?.length || 0);
    allLicenses.data?.items?.forEach((item: any, index: number) => {
      const expDate = item.fields[DRIVERS_LICENSE_FIELDS.expiration_date];
      const status = item.fields[DRIVERS_LICENSE_FIELDS.status];
      const approvalStatus = item.fields[DRIVERS_LICENSE_FIELDS.approval_status];
      const deletedFlag = item.fields[DRIVERS_LICENSE_FIELDS.deleted_flag];
      console.log(`[Expiring Licenses] License ${index}: expiration_date=${expDate} (${new Date(expDate).toISOString()}), status=${status}, approval_status=${approvalStatus}, deleted_flag=${deletedFlag}`);
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

/**
 * 有効期限切れの免許証を取得
 */
export async function getExpiredDriversLicenses(): Promise<DriversLicense[]> {
  try {
    // 今日の日付（0時0分0秒にリセット）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log("[Expired Licenses] Today:", today.toISOString(), today.getTime());

    // approval_statusも確認（承認フローが完了しているか）
    const filter = `AND(
      CurrentValue.[deleted_flag]=false,
      OR(CurrentValue.[status]="approved", CurrentValue.[approval_status]="approved"),
      CurrentValue.[expiration_date]<${today.getTime()}
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
    console.error("Error fetching expired drivers licenses:", error);
    throw error;
  }
}
