import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireViewPermission } from "@/lib/auth-utils";
import { getPermitById } from "@/services/permit.service";
import { readPermitPdf } from "@/services/pdf-generator.service";

/**
 * GET /api/permits/download/[id]
 * 許可証PDFをダウンロード
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "許可証IDが必要です" },
        { status: 400 }
      );
    }

    // 許可証を取得
    const permit = await getPermitById(id);
    if (!permit) {
      return NextResponse.json(
        { success: false, error: "許可証が見つかりません" },
        { status: 404 }
      );
    }

    // 権限チェック（本人または閲覧権限）
    const authCheck = await requireAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    if (authCheck.userId !== permit.employee_id) {
      const viewCheck = await requireViewPermission();
      if (!viewCheck.authorized) {
        return viewCheck.response;
      }
    }

    // PDFファイルを読み込む
    const pdfBuffer = readPermitPdf(permit.permit_file_key);
    if (!pdfBuffer) {
      return NextResponse.json(
        { success: false, error: "許可証PDFファイルが見つかりません" },
        { status: 404 }
      );
    }

    // ファイル名を生成
    const fileName = `permit_${permit.employee_name}_${permit.vehicle_number}.pdf`;
    const encodedFileName = encodeURIComponent(fileName);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("許可証ダウンロードエラー:", error);
    return NextResponse.json(
      { success: false, error: "許可証のダウンロードに失敗しました" },
      { status: 500 }
    );
  }
}
