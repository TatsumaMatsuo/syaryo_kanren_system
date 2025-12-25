import { NextRequest, NextResponse } from "next/server";
import {
  approveDriversLicense,
  getDriversLicenses,
} from "@/services/drivers-license.service";
import {
  approveVehicleRegistration,
  getVehicleRegistrations,
} from "@/services/vehicle-registration.service";
import {
  approveInsurancePolicy,
  getInsurancePolicies,
} from "@/services/insurance-policy.service";
import { requireAdmin, getCurrentUser } from "@/lib/auth-utils";
import { getBaseRecords } from "@/lib/lark-client";
import { LARK_TABLES, EMPLOYEE_FIELDS } from "@/lib/lark-tables";
import { recordApprovalHistory } from "@/services/approval-history.service";
import { getEmployee } from "@/services/employee.service";
import {
  createPermit,
  revokeExistingPermit,
} from "@/services/permit.service";
import { generatePermitPdf } from "@/services/pdf-generator.service";
import { calculatePermitExpiration } from "@/lib/permit-utils";

/**
 * 全書類が承認済みかチェックし、許可証を発行
 */
async function checkAndGeneratePermit(
  employeeId: string,
  baseUrl: string
): Promise<void> {
  try {
    // 免許証を確認
    const licenses = await getDriversLicenses(employeeId);
    const approvedLicense = licenses.find((l) => l.approval_status === "approved");
    if (!approvedLicense) return;

    // 車検証を確認（承認済みのもの全て）
    const vehicles = await getVehicleRegistrations(employeeId);
    const approvedVehicles = vehicles.filter((v) => v.approval_status === "approved");
    if (approvedVehicles.length === 0) return;

    // 保険証を確認
    const insurances = await getInsurancePolicies(employeeId);
    const approvedInsurance = insurances.find((i) => i.approval_status === "approved");
    if (!approvedInsurance) return;

    // 社員情報を取得
    const employee = await getEmployee(employeeId);
    if (!employee) return;

    // 各車両に対して許可証を発行
    for (const vehicle of approvedVehicles) {
      try {
        // 既存の許可証があれば無効化
        await revokeExistingPermit(vehicle.id);

        // 有効期限を計算
        const expirationDate = calculatePermitExpiration(
          approvedLicense.expiration_date,
          vehicle.inspection_expiration_date,
          approvedInsurance.coverage_end_date
        );

        // 許可証を作成
        const permitData = {
          employee_id: employeeId,
          employee_name: employee.employee_name,
          vehicle_id: vehicle.id,
          vehicle_number: vehicle.vehicle_number,
          vehicle_model: `${vehicle.manufacturer} ${vehicle.model_name}`,
          expiration_date: expirationDate,
        };

        const permit = await createPermit(permitData, "");

        // PDFを生成
        const fileKey = await generatePermitPdf({
          employeeName: employee.employee_name,
          vehicleNumber: vehicle.vehicle_number,
          vehicleModel: `${vehicle.manufacturer} ${vehicle.model_name}`,
          issueDate: new Date(),
          expirationDate,
          permitId: permit.id,
          verificationToken: permit.verification_token,
          baseUrl,
        });

        // 許可証のfile_keyを更新
        const { updatePermitFileKey } = await import("@/services/permit.service");
        await updatePermitFileKey(permit.id, fileKey);

        console.log(`許可証を発行しました: ${employee.employee_name} - ${vehicle.vehicle_number}`);
      } catch (error) {
        console.error(`許可証発行エラー (車両: ${vehicle.id}):`, error);
      }
    }
  } catch (error) {
    console.error("許可証チェック・発行エラー:", error);
  }
}

/**
 * POST /api/approvals/:id
 * 申請を承認（管理者のみ）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 管理者権限チェック
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { type } = body; // "license" | "vehicle" | "insurance"

    // 現在のユーザー情報を取得
    const currentUser = await getCurrentUser();

    // 承認処理を実行前に申請レコードを取得（履歴記録用）
    let applicationRecords: any[];
    let applicationRecord: any = null;

    switch (type) {
      case "license":
        applicationRecords = await getDriversLicenses();
        applicationRecord = applicationRecords.find((r) => r.id === id);
        await approveDriversLicense(id);
        break;
      case "vehicle":
        applicationRecords = await getVehicleRegistrations();
        applicationRecord = applicationRecords.find((r) => r.id === id);
        await approveVehicleRegistration(id);
        break;
      case "insurance":
        applicationRecords = await getInsurancePolicies();
        applicationRecord = applicationRecords.find((r) => r.id === id);
        await approveInsurancePolicy(id);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid type",
          },
          { status: 400 }
        );
    }

    // 承認履歴を記録
    if (applicationRecord && currentUser) {
      // 従業員マスタから従業員名を取得
      let employeeName = "不明";
      if (applicationRecord.employee_id) {
        try {
          const employeesResponse = await getBaseRecords(LARK_TABLES.EMPLOYEES, {
            filter: `CurrentValue.[${EMPLOYEE_FIELDS.employee_id}]="${applicationRecord.employee_id}"`,
          });
          const employee = employeesResponse.data?.items?.[0];
          if (employee) {
            employeeName = String(employee.fields[EMPLOYEE_FIELDS.employee_name] || "不明");
          }
        } catch (error) {
          console.error("Failed to get employee name:", error);
        }
      }

      await recordApprovalHistory({
        application_type: type as "license" | "vehicle" | "insurance",
        application_id: id,
        employee_id: applicationRecord.employee_id || "",
        employee_name: employeeName,
        action: "approved",
        approver_id: currentUser.id || currentUser.email || "",
        approver_name: currentUser.name || currentUser.email || "不明",
        timestamp: Date.now(),
      });

      // 許可証の自動発行チェック（全書類が承認済みの場合）
      if (applicationRecord.employee_id) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
        await checkAndGeneratePermit(applicationRecord.employee_id, baseUrl);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Application approved successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/approvals/:id:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to approve application",
      },
      { status: 500 }
    );
  }
}
