import { VehicleRegistration } from "@/types";
import {
  getBaseRecords,
  createBaseRecord,
  updateBaseRecord,
  deleteBaseRecord,
} from "@/lib/lark-client";
import { LARK_TABLES, VEHICLE_REGISTRATION_FIELDS } from "@/lib/lark-tables";

/**
 * 車検証一覧を取得（削除済みを除外）
 */
export async function getVehicleRegistrations(
  employeeId?: string
): Promise<VehicleRegistration[]> {
  try {
    const filter = employeeId
      ? `AND(CurrentValue.[deleted_flag]=false, CurrentValue.[employee_id]="${employeeId}")`
      : `CurrentValue.[deleted_flag]=false`;

    const response = await getBaseRecords(LARK_TABLES.VEHICLE_REGISTRATIONS, {
      filter,
    });

    const registrations: VehicleRegistration[] =
      response.data?.items?.map((item: any) => ({
        id: item.record_id,
        employee_id: item.fields[VEHICLE_REGISTRATION_FIELDS.employee_id],
        vehicle_number: item.fields[VEHICLE_REGISTRATION_FIELDS.vehicle_number],
        vehicle_type: item.fields[VEHICLE_REGISTRATION_FIELDS.vehicle_type],
        manufacturer: item.fields[VEHICLE_REGISTRATION_FIELDS.manufacturer],
        model_name: item.fields[VEHICLE_REGISTRATION_FIELDS.model_name],
        inspection_expiration_date: new Date(
          item.fields[VEHICLE_REGISTRATION_FIELDS.inspection_expiration_date]
        ),
        owner_name: item.fields[VEHICLE_REGISTRATION_FIELDS.owner_name],
        image_url: item.fields[VEHICLE_REGISTRATION_FIELDS.image_url],
        status: item.fields[VEHICLE_REGISTRATION_FIELDS.status],
        approval_status: item.fields[VEHICLE_REGISTRATION_FIELDS.approval_status],
        rejection_reason: item.fields[VEHICLE_REGISTRATION_FIELDS.rejection_reason],
        created_at: new Date(item.fields[VEHICLE_REGISTRATION_FIELDS.created_at]),
        updated_at: new Date(item.fields[VEHICLE_REGISTRATION_FIELDS.updated_at]),
        deleted_flag: item.fields[VEHICLE_REGISTRATION_FIELDS.deleted_flag] || false,
        deleted_at: item.fields[VEHICLE_REGISTRATION_FIELDS.deleted_at]
          ? new Date(item.fields[VEHICLE_REGISTRATION_FIELDS.deleted_at])
          : undefined,
      })) || [];

    return registrations;
  } catch (error) {
    console.error("Error fetching vehicle registrations:", error);
    throw error;
  }
}

/**
 * 車検証を新規作成
 */
export async function createVehicleRegistration(
  data: Omit<VehicleRegistration, "id" | "created_at" | "updated_at">
): Promise<VehicleRegistration> {
  try {
    const fields = {
      [VEHICLE_REGISTRATION_FIELDS.employee_id]: data.employee_id,
      [VEHICLE_REGISTRATION_FIELDS.vehicle_number]: data.vehicle_number,
      [VEHICLE_REGISTRATION_FIELDS.vehicle_type]: data.vehicle_type,
      [VEHICLE_REGISTRATION_FIELDS.manufacturer]: data.manufacturer,
      [VEHICLE_REGISTRATION_FIELDS.model_name]: data.model_name,
      [VEHICLE_REGISTRATION_FIELDS.inspection_expiration_date]:
        data.inspection_expiration_date.toISOString(),
      [VEHICLE_REGISTRATION_FIELDS.owner_name]: data.owner_name,
      [VEHICLE_REGISTRATION_FIELDS.image_url]: data.image_url,
      [VEHICLE_REGISTRATION_FIELDS.status]: data.status,
      [VEHICLE_REGISTRATION_FIELDS.approval_status]: data.approval_status,
      [VEHICLE_REGISTRATION_FIELDS.rejection_reason]: data.rejection_reason || "",
      [VEHICLE_REGISTRATION_FIELDS.created_at]: new Date().toISOString(),
      [VEHICLE_REGISTRATION_FIELDS.updated_at]: new Date().toISOString(),
      [VEHICLE_REGISTRATION_FIELDS.deleted_flag]: false,
    };

    const response = await createBaseRecord(LARK_TABLES.VEHICLE_REGISTRATIONS, fields);

    return {
      id: response.data?.record?.record_id || "",
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
  } catch (error) {
    console.error("Error creating vehicle registration:", error);
    throw error;
  }
}

/**
 * 車検証を更新
 */
export async function updateVehicleRegistration(
  id: string,
  data: Partial<Omit<VehicleRegistration, "id" | "created_at">>
): Promise<void> {
  try {
    const fields: Record<string, any> = {
      [VEHICLE_REGISTRATION_FIELDS.updated_at]: new Date().toISOString(),
    };

    if (data.vehicle_number)
      fields[VEHICLE_REGISTRATION_FIELDS.vehicle_number] = data.vehicle_number;
    if (data.vehicle_type) fields[VEHICLE_REGISTRATION_FIELDS.vehicle_type] = data.vehicle_type;
    if (data.manufacturer) fields[VEHICLE_REGISTRATION_FIELDS.manufacturer] = data.manufacturer;
    if (data.model_name) fields[VEHICLE_REGISTRATION_FIELDS.model_name] = data.model_name;
    if (data.inspection_expiration_date)
      fields[VEHICLE_REGISTRATION_FIELDS.inspection_expiration_date] =
        data.inspection_expiration_date.toISOString();
    if (data.owner_name) fields[VEHICLE_REGISTRATION_FIELDS.owner_name] = data.owner_name;
    if (data.image_url) fields[VEHICLE_REGISTRATION_FIELDS.image_url] = data.image_url;
    if (data.status) fields[VEHICLE_REGISTRATION_FIELDS.status] = data.status;
    if (data.approval_status)
      fields[VEHICLE_REGISTRATION_FIELDS.approval_status] = data.approval_status;
    if (data.rejection_reason !== undefined)
      fields[VEHICLE_REGISTRATION_FIELDS.rejection_reason] = data.rejection_reason;

    await updateBaseRecord(LARK_TABLES.VEHICLE_REGISTRATIONS, id, fields);
  } catch (error) {
    console.error("Error updating vehicle registration:", error);
    throw error;
  }
}

/**
 * 車検証を論理削除
 */
export async function deleteVehicleRegistration(id: string): Promise<void> {
  try {
    await deleteBaseRecord(LARK_TABLES.VEHICLE_REGISTRATIONS, id);
  } catch (error) {
    console.error("Error deleting vehicle registration:", error);
    throw error;
  }
}

/**
 * 車検証の承認
 */
export async function approveVehicleRegistration(id: string): Promise<void> {
  try {
    await updateVehicleRegistration(id, {
      status: "approved",
      approval_status: "approved",
    });
  } catch (error) {
    console.error("Error approving vehicle registration:", error);
    throw error;
  }
}

/**
 * 車検証の却下
 */
export async function rejectVehicleRegistration(id: string, reason: string): Promise<void> {
  try {
    await updateVehicleRegistration(id, {
      approval_status: "rejected",
      rejection_reason: reason,
    });
  } catch (error) {
    console.error("Error rejecting vehicle registration:", error);
    throw error;
  }
}

/**
 * 有効期限が近い車検証を取得（7日以内）
 */
export async function getExpiringVehicleRegistrations(): Promise<VehicleRegistration[]> {
  try {
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const today = new Date();

    const filter = `AND(
      CurrentValue.[deleted_flag]=false,
      CurrentValue.[status]="approved",
      CurrentValue.[inspection_expiration_date]>=${today.getTime()},
      CurrentValue.[inspection_expiration_date]<=${sevenDaysLater.getTime()}
    )`;

    const response = await getBaseRecords(LARK_TABLES.VEHICLE_REGISTRATIONS, {
      filter,
    });

    const registrations: VehicleRegistration[] =
      response.data?.items?.map((item: any) => ({
        id: item.record_id,
        employee_id: item.fields[VEHICLE_REGISTRATION_FIELDS.employee_id],
        vehicle_number: item.fields[VEHICLE_REGISTRATION_FIELDS.vehicle_number],
        vehicle_type: item.fields[VEHICLE_REGISTRATION_FIELDS.vehicle_type],
        manufacturer: item.fields[VEHICLE_REGISTRATION_FIELDS.manufacturer],
        model_name: item.fields[VEHICLE_REGISTRATION_FIELDS.model_name],
        inspection_expiration_date: new Date(
          item.fields[VEHICLE_REGISTRATION_FIELDS.inspection_expiration_date]
        ),
        owner_name: item.fields[VEHICLE_REGISTRATION_FIELDS.owner_name],
        image_url: item.fields[VEHICLE_REGISTRATION_FIELDS.image_url],
        status: item.fields[VEHICLE_REGISTRATION_FIELDS.status],
        approval_status: item.fields[VEHICLE_REGISTRATION_FIELDS.approval_status],
        rejection_reason: item.fields[VEHICLE_REGISTRATION_FIELDS.rejection_reason],
        created_at: new Date(item.fields[VEHICLE_REGISTRATION_FIELDS.created_at]),
        updated_at: new Date(item.fields[VEHICLE_REGISTRATION_FIELDS.updated_at]),
        deleted_flag: false,
      })) || [];

    return registrations;
  } catch (error) {
    console.error("Error fetching expiring vehicle registrations:", error);
    throw error;
  }
}
