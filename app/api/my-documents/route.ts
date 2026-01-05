import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getDriversLicenses } from "@/services/drivers-license.service";
import { getVehicleRegistrations } from "@/services/vehicle-registration.service";
import { getInsurancePolicies } from "@/services/insurance-policy.service";
import { getEmployeeByEmail } from "@/services/employee.service";

/**
 * GET /api/my-documents
 * 現在のユーザーの書類情報を取得
 *
 * リレーション:
 * - 社員:免許証 = 1:1
 * - 社員:車検証 = 1:多
 * - 社員:保険証 = 1:多
 */
export async function GET(request: NextRequest) {
  // 認証チェック
  const authCheck = await requireAuth();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    // クエリパラメータから employee_id を取得（代理申請用）
    const { searchParams } = new URL(request.url);
    const employeeIdParam = searchParams.get("employee_id");

    // 代理申請の場合はパラメータのIDを使用、それ以外はメールから社員コードを取得
    let userId = employeeIdParam;
    if (!userId && authCheck.userId) {
      // メールアドレスから社員コードを取得
      const employee = await getEmployeeByEmail(authCheck.userId);
      userId = employee?.employee_id || null;
    }

    console.log(`[my-documents] userId: ${userId} (param: ${employeeIdParam}, auth: ${authCheck.userId})`);

    // 各書類を取得
    console.log(`[my-documents] Fetching documents...`);
    const [licenses, vehicles, insurances] = await Promise.all([
      getDriversLicenses(),
      getVehicleRegistrations(),
      getInsurancePolicies(),
    ]);
    console.log(`[my-documents] Fetch completed`);

    console.log(`[my-documents] licenses count: ${licenses.length}, employee_ids: ${licenses.map(l => l.employee_id).join(', ')}`);
    console.log(`[my-documents] vehicles count: ${vehicles.length}, employee_ids: ${vehicles.map(v => v.employee_id).join(', ')}`);
    console.log(`[my-documents] insurances count: ${insurances.length}, employee_ids: ${insurances.map(i => i.employee_id).join(', ')}`);

    // ユーザーの書類をフィルタリング
    // 免許証は1:1なのでfind（最初の1件）
    const myLicense = licenses.find((l) => l.employee_id === userId);
    // 車検証・保険証は1:多なのでfilter（全件）
    const myVehicles = vehicles.filter((v) => v.employee_id === userId);
    const myInsurances = insurances.filter((i) => i.employee_id === userId);

    console.log(`[my-documents] myLicense found: ${!!myLicense}, myVehicles: ${myVehicles.length}, myInsurances: ${myInsurances.length}`);
    console.log(`[my-documents] myLicense.image_attachment:`, JSON.stringify(myLicense?.image_attachment));

    return NextResponse.json({
      success: true,
      data: {
        license: myLicense || null,
        vehicles: myVehicles,      // 配列で返す
        insurances: myInsurances,  // 配列で返す
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
