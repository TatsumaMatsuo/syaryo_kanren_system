import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getDriversLicenses } from "@/services/drivers-license.service";
import { getVehicleRegistrations } from "@/services/vehicle-registration.service";
import { getInsurancePolicies } from "@/services/insurance-policy.service";

/**
 * GET /api/my-documents
 * 現在のユーザーの書類情報を取得
 */
export async function GET(request: NextRequest) {
  // 認証チェック
  const authCheck = await requireAuth();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const userId = authCheck.userId;

    // 各書類を取得
    const [licenses, vehicles, insurances] = await Promise.all([
      getDriversLicenses(),
      getVehicleRegistrations(),
      getInsurancePolicies(),
    ]);

    // ユーザーの書類をフィルタリング
    const myLicense = licenses.find((l) => l.employee_id === userId);
    const myVehicle = vehicles.find((v) => v.employee_id === userId);
    const myInsurance = insurances.find((i) => i.employee_id === userId);

    return NextResponse.json({
      success: true,
      data: {
        license: myLicense || null,
        vehicle: myVehicle || null,
        insurance: myInsurance || null,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/my-documents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch documents",
      },
      { status: 500 }
    );
  }
}
