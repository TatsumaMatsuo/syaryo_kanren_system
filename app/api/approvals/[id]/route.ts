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
import { LARK_TABLES } from "@/lib/lark-tables";
import { recordApprovalHistory } from "@/services/approval-history.service";

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
            filter: `CurrentValue.[employee_id]="${applicationRecord.employee_id}"`,
          });
          const employee = employeesResponse.data?.items?.[0];
          if (employee) {
            employeeName = employee.fields.name || employee.fields.employee_name || "不明";
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
