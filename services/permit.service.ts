import { Permit, CreatePermitInput, PermitStatus } from "@/types";
import {
  getBaseRecords,
  createBaseRecord,
  updateBaseRecord,
} from "@/lib/lark-client";
import { LARK_TABLES, PERMIT_FIELDS } from "@/lib/lark-tables";

/**
 * UUIDを生成（verification_token用）
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * 許可証一覧を取得
 */
export async function getPermits(employeeId?: string): Promise<Permit[]> {
  try {
    const filter = employeeId
      ? `CurrentValue.[employee_id]="${employeeId}"`
      : undefined;

    const response = await getBaseRecords(LARK_TABLES.PERMITS, {
      filter,
    });

    const permits: Permit[] =
      response.data?.items?.map((item: any) => ({
        id: item.record_id || "",
        employee_id: item.fields[PERMIT_FIELDS.employee_id],
        employee_name: item.fields[PERMIT_FIELDS.employee_name],
        vehicle_id: item.fields[PERMIT_FIELDS.vehicle_id],
        vehicle_number: item.fields[PERMIT_FIELDS.vehicle_number],
        vehicle_model: item.fields[PERMIT_FIELDS.vehicle_model],
        issue_date: new Date(item.fields[PERMIT_FIELDS.issue_date]),
        expiration_date: new Date(item.fields[PERMIT_FIELDS.expiration_date]),
        permit_file_key: item.fields[PERMIT_FIELDS.permit_file_key],
        verification_token: item.fields[PERMIT_FIELDS.verification_token],
        status: item.fields[PERMIT_FIELDS.status] as PermitStatus,
        created_at: new Date(item.fields[PERMIT_FIELDS.created_at]),
        updated_at: new Date(item.fields[PERMIT_FIELDS.updated_at]),
      })) || [];

    return permits;
  } catch (error) {
    console.error("Error fetching permits:", error);
    throw error;
  }
}

/**
 * 許可証を取得（ID指定）
 * IDはLark Baseのrecord_idを使用
 */
export async function getPermitById(id: string): Promise<Permit | null> {
  try {
    // 全レコードを取得してrecord_idでフィルタ
    const response = await getBaseRecords(LARK_TABLES.PERMITS, {});

    const item: any = response.data?.items?.find(
      (item: any) => item.record_id === id
    );
    if (!item) return null;

    return {
      id: item.record_id || "",
      employee_id: item.fields[PERMIT_FIELDS.employee_id],
      employee_name: item.fields[PERMIT_FIELDS.employee_name],
      vehicle_id: item.fields[PERMIT_FIELDS.vehicle_id],
      vehicle_number: item.fields[PERMIT_FIELDS.vehicle_number],
      vehicle_model: item.fields[PERMIT_FIELDS.vehicle_model],
      issue_date: new Date(item.fields[PERMIT_FIELDS.issue_date]),
      expiration_date: new Date(item.fields[PERMIT_FIELDS.expiration_date]),
      permit_file_key: item.fields[PERMIT_FIELDS.permit_file_key],
      verification_token: item.fields[PERMIT_FIELDS.verification_token],
      status: item.fields[PERMIT_FIELDS.status] as PermitStatus,
      created_at: new Date(item.fields[PERMIT_FIELDS.created_at]),
      updated_at: new Date(item.fields[PERMIT_FIELDS.updated_at]),
    };
  } catch (error) {
    console.error("Error fetching permit by id:", error);
    throw error;
  }
}

/**
 * 許可証を取得（verification_token指定）
 */
export async function getPermitByToken(token: string): Promise<Permit | null> {
  try {
    const filter = `CurrentValue.[verification_token]="${token}"`;

    const response = await getBaseRecords(LARK_TABLES.PERMITS, {
      filter,
    });

    const item: any = response.data?.items?.[0];
    if (!item) return null;

    return {
      id: item.record_id || "",
      employee_id: item.fields[PERMIT_FIELDS.employee_id],
      employee_name: item.fields[PERMIT_FIELDS.employee_name],
      vehicle_id: item.fields[PERMIT_FIELDS.vehicle_id],
      vehicle_number: item.fields[PERMIT_FIELDS.vehicle_number],
      vehicle_model: item.fields[PERMIT_FIELDS.vehicle_model],
      issue_date: new Date(item.fields[PERMIT_FIELDS.issue_date]),
      expiration_date: new Date(item.fields[PERMIT_FIELDS.expiration_date]),
      permit_file_key: item.fields[PERMIT_FIELDS.permit_file_key],
      verification_token: item.fields[PERMIT_FIELDS.verification_token],
      status: item.fields[PERMIT_FIELDS.status] as PermitStatus,
      created_at: new Date(item.fields[PERMIT_FIELDS.created_at]),
      updated_at: new Date(item.fields[PERMIT_FIELDS.updated_at]),
    };
  } catch (error) {
    console.error("Error fetching permit by token:", error);
    throw error;
  }
}

/**
 * 許可証を新規作成
 */
export async function createPermit(
  data: CreatePermitInput,
  permitFileKey: string
): Promise<Permit> {
  try {
    const now = Date.now();
    const verificationToken = generateUUID();

    const fields: Record<string, any> = {
      [PERMIT_FIELDS.employee_id]: data.employee_id,
      [PERMIT_FIELDS.employee_name]: data.employee_name,
      [PERMIT_FIELDS.vehicle_id]: data.vehicle_id,
      [PERMIT_FIELDS.vehicle_number]: data.vehicle_number,
      [PERMIT_FIELDS.vehicle_model]: data.vehicle_model,
      [PERMIT_FIELDS.issue_date]: now,
      [PERMIT_FIELDS.expiration_date]: data.expiration_date.getTime(),
      [PERMIT_FIELDS.permit_file_key]: permitFileKey,
      [PERMIT_FIELDS.verification_token]: verificationToken,
      [PERMIT_FIELDS.status]: "valid" as PermitStatus,
      [PERMIT_FIELDS.created_at]: now,
      [PERMIT_FIELDS.updated_at]: now,
    };

    const response = await createBaseRecord(LARK_TABLES.PERMITS, fields);

    return {
      id: response.data?.record?.record_id || "",
      employee_id: data.employee_id,
      employee_name: data.employee_name,
      vehicle_id: data.vehicle_id,
      vehicle_number: data.vehicle_number,
      vehicle_model: data.vehicle_model,
      issue_date: new Date(now),
      expiration_date: data.expiration_date,
      permit_file_key: permitFileKey,
      verification_token: verificationToken,
      status: "valid",
      created_at: new Date(now),
      updated_at: new Date(now),
    };
  } catch (error) {
    console.error("Error creating permit:", error);
    throw error;
  }
}

/**
 * 許可証のステータスを更新
 */
export async function updatePermitStatus(
  id: string,
  status: PermitStatus
): Promise<void> {
  try {
    const fields: Record<string, any> = {
      [PERMIT_FIELDS.status]: status,
      [PERMIT_FIELDS.updated_at]: Date.now(),
    };

    await updateBaseRecord(LARK_TABLES.PERMITS, id, fields);
  } catch (error) {
    console.error("Error updating permit status:", error);
    throw error;
  }
}

/**
 * 許可証のファイルキーを更新
 */
export async function updatePermitFileKey(
  id: string,
  permitFileKey: string
): Promise<void> {
  try {
    const fields: Record<string, any> = {
      [PERMIT_FIELDS.permit_file_key]: permitFileKey,
      [PERMIT_FIELDS.updated_at]: Date.now(),
    };

    await updateBaseRecord(LARK_TABLES.PERMITS, id, fields);
  } catch (error) {
    console.error("Error updating permit file key:", error);
    throw error;
  }
}

/**
 * 有効な許可証を取得（車両ID指定）
 */
export async function getValidPermitByVehicleId(
  vehicleId: string
): Promise<Permit | null> {
  try {
    const filter = `AND(CurrentValue.[vehicle_id]="${vehicleId}",CurrentValue.[status]="valid")`;

    const response = await getBaseRecords(LARK_TABLES.PERMITS, {
      filter,
    });

    const item: any = response.data?.items?.[0];
    if (!item) return null;

    return {
      id: item.record_id || "",
      employee_id: item.fields[PERMIT_FIELDS.employee_id],
      employee_name: item.fields[PERMIT_FIELDS.employee_name],
      vehicle_id: item.fields[PERMIT_FIELDS.vehicle_id],
      vehicle_number: item.fields[PERMIT_FIELDS.vehicle_number],
      vehicle_model: item.fields[PERMIT_FIELDS.vehicle_model],
      issue_date: new Date(item.fields[PERMIT_FIELDS.issue_date]),
      expiration_date: new Date(item.fields[PERMIT_FIELDS.expiration_date]),
      permit_file_key: item.fields[PERMIT_FIELDS.permit_file_key],
      verification_token: item.fields[PERMIT_FIELDS.verification_token],
      status: item.fields[PERMIT_FIELDS.status] as PermitStatus,
      created_at: new Date(item.fields[PERMIT_FIELDS.created_at]),
      updated_at: new Date(item.fields[PERMIT_FIELDS.updated_at]),
    };
  } catch (error) {
    console.error("Error fetching valid permit by vehicle id:", error);
    throw error;
  }
}

/**
 * 期限切れの許可証を取得
 */
export async function getExpiredPermits(): Promise<Permit[]> {
  try {
    const now = Date.now();
    const filter = `AND(CurrentValue.[status]="valid",CurrentValue.[expiration_date]<${now})`;

    const response = await getBaseRecords(LARK_TABLES.PERMITS, {
      filter,
    });

    const permits: Permit[] =
      response.data?.items?.map((item: any) => ({
        id: item.record_id || "",
        employee_id: item.fields[PERMIT_FIELDS.employee_id],
        employee_name: item.fields[PERMIT_FIELDS.employee_name],
        vehicle_id: item.fields[PERMIT_FIELDS.vehicle_id],
        vehicle_number: item.fields[PERMIT_FIELDS.vehicle_number],
        vehicle_model: item.fields[PERMIT_FIELDS.vehicle_model],
        issue_date: new Date(item.fields[PERMIT_FIELDS.issue_date]),
        expiration_date: new Date(item.fields[PERMIT_FIELDS.expiration_date]),
        permit_file_key: item.fields[PERMIT_FIELDS.permit_file_key],
        verification_token: item.fields[PERMIT_FIELDS.verification_token],
        status: item.fields[PERMIT_FIELDS.status] as PermitStatus,
        created_at: new Date(item.fields[PERMIT_FIELDS.created_at]),
        updated_at: new Date(item.fields[PERMIT_FIELDS.updated_at]),
      })) || [];

    return permits;
  } catch (error) {
    console.error("Error fetching expired permits:", error);
    throw error;
  }
}

/**
 * 既存の許可証を無効化（revoke）
 */
export async function revokeExistingPermit(vehicleId: string): Promise<void> {
  try {
    const existingPermit = await getValidPermitByVehicleId(vehicleId);
    if (existingPermit) {
      await updatePermitStatus(existingPermit.id, "revoked");
    }
  } catch (error) {
    console.error("Error revoking existing permit:", error);
    throw error;
  }
}
