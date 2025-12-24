import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { detectFileType, isPdfMimeType } from "@/lib/file-type-detection";
import fs from "fs";
import path from "path";

// ローカルファイル保存ディレクトリ
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * GET /api/files/[fileKey]
 *
 * ローカルストレージに保存されたファイルを返す
 * 認証済みユーザーのみアクセス可能
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileKey: string }> }
) {
  try {
    // 認証チェック
    const authCheck = await requireAuth();
    if (!authCheck.authorized) {
      const resolvedParams = await params;
      console.warn(`[File API] Unauthorized access attempt - fileKey: ${resolvedParams.fileKey}`);
      return authCheck.response;
    }

    const resolvedParams = await params;
    const { fileKey } = resolvedParams;

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    // パストラバーサル攻撃の防止
    const sanitizedFileKey = path.basename(fileKey);
    const filePath = path.join(UPLOAD_DIR, sanitizedFileKey);

    // ファイルが存在するか確認
    if (!fs.existsSync(filePath)) {
      console.warn(`[File API] File not found - fileKey: ${fileKey}, user: ${authCheck.userId}`);
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // アクセスログ記録
    console.log(`[File API] Access granted - user: ${authCheck.userId}, fileKey: ${fileKey}`);

    // ファイルを読み込み
    const fileBuffer = fs.readFileSync(filePath);

    // マジックバイトからファイルタイプを検出
    const detectedType = detectFileType(fileBuffer);
    const contentType = detectedType.mimeType;

    console.log(`[File API] Detected content type: ${contentType} for fileKey: ${fileKey}`);

    // PDFの場合もインライン表示
    const contentDisposition = "inline";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[File API] Internal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
