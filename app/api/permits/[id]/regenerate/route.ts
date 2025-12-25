import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { getPermitById, updatePermitFileKey } from "@/services/permit.service";
import { generatePermitPdf } from "@/services/pdf-generator.service";

/**
 * POST /api/permits/[id]/regenerate
 * 許可証PDFを再生成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const { id } = await params;

    // 許可証を取得
    const permit = await getPermitById(id);
    if (!permit) {
      return NextResponse.json(
        { success: false, error: "許可証が見つかりません" },
        { status: 404 }
      );
    }

    // PDFを再生成
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const fileKey = await generatePermitPdf({
      employeeName: permit.employee_name,
      vehicleNumber: permit.vehicle_number,
      vehicleModel: permit.vehicle_model,
      issueDate: permit.issue_date,
      expirationDate: permit.expiration_date,
      permitId: permit.id,
      verificationToken: permit.verification_token,
      baseUrl,
    });

    // file_keyを更新
    await updatePermitFileKey(id, fileKey);

    return NextResponse.json({
      success: true,
      message: "許可証PDFを再生成しました",
      file_key: fileKey,
    });
  } catch (error) {
    console.error("許可証再生成エラー:", error);
    return NextResponse.json(
      { success: false, error: "許可証PDFの再生成に失敗しました" },
      { status: 500 }
    );
  }
}
