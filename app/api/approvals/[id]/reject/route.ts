import { NextRequest, NextResponse } from "next/server";
import {
  rejectDriversLicense,
  getDriversLicenses,
} from "@/services/drivers-license.service";
import {
  rejectVehicleRegistration,
  getVehicleRegistrations,
} from "@/services/vehicle-registration.service";
import {
  rejectInsurancePolicy,
  getInsurancePolicies,
} from "@/services/insurance-policy.service";
import { requireAdmin, getCurrentUser } from "@/lib/auth-utils";
import { getBaseRecords } from "@/lib/lark-client";
import { LARK_TABLES } from "@/lib/lark-tables";
import { recordApprovalHistory } from "@/services/approval-history.service";

/**
 * POST /api/approvals/:id/reject
 * 申請を却下（管理者のみ）
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
    const { type, reason } = body; // "license" | "vehicle" | "insurance"

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Rejection reason is required",
        },
        { status: 400 }
      );
    }

    // 現在のユーザー情報を取得
    const currentUser = await getCurrentUser();

    // 却下処理を実行前に申請レコードを取得（履歴記録用）
    let applicationRecords: any[];
    let applicationRecord: any = null;

    switch (type) {
      case "license":
        applicationRecords = await getDriversLicenses();
        applicationRecord = applicationRecords.find((r) => r.id === id);
        await rejectDriversLicense(id, reason);
        break;
      case "vehicle":
        applicationRecords = await getVehicleRegistrations();
        applicationRecord = applicationRecords.find((r) => r.id === id);
        await rejectVehicleRegistration(id, reason);
        break;
      case "insurance":
        applicationRecords = await getInsurancePolicies();
        applicationRecord = applicationRecords.find((r) => r.id === id);
        await rejectInsurancePolicy(id, reason);
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

    // 却下履歴を記録
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
        action: "rejected",
        approver_id: currentUser.id || currentUser.email || "",
        approver_name: currentUser.name || currentUser.email || "不明",
        reason,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Application rejected successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/approvals/:id/reject:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reject application",
      },
      { status: 500 }
    );
  }
}
