import { NextRequest, NextResponse } from "next/server";
import {
  approveDriversLicense,
  rejectDriversLicense,
} from "@/services/drivers-license.service";
import {
  approveVehicleRegistration,
  rejectVehicleRegistration,
} from "@/services/vehicle-registration.service";
import {
  approveInsurancePolicy,
  rejectInsurancePolicy,
} from "@/services/insurance-policy.service";

/**
 * POST /api/approvals/:id
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

    switch (type) {
      case "license":
        await approveDriversLicense(id);
        break;
      case "vehicle":
        await approveVehicleRegistration(id);
        break;
      case "insurance":
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
