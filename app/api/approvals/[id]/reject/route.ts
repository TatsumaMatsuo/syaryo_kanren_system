import { NextRequest, NextResponse } from "next/server";
import { rejectDriversLicense } from "@/services/drivers-license.service";
import { rejectVehicleRegistration } from "@/services/vehicle-registration.service";
import { rejectInsurancePolicy } from "@/services/insurance-policy.service";
import { requireAdmin } from "@/lib/auth-utils";

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

    switch (type) {
      case "license":
        await rejectDriversLicense(id, reason);
        break;
      case "vehicle":
        await rejectVehicleRegistration(id, reason);
        break;
      case "insurance":
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
