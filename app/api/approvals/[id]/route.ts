import { NextRequest, NextResponse } from "next/server";
import {
  approveDriversLicense,
  rejectDriversLicense,
} from "@/services/drivers-license.service";

/**
 * POST /api/approvals/:id/approve
 * 申請を承認
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type } = body; // "license" | "vehicle" | "insurance"

    // TODO: type に応じて適切なサービスを呼び出す
    // 現在は免許証のみ実装
    if (type === "license") {
      await approveDriversLicense(id);
    }

    return NextResponse.json({
      success: true,
      message: "Application approved successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/approvals/:id/approve:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to approve application",
      },
      { status: 500 }
    );
  }
}
