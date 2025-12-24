import { NextRequest, NextResponse } from "next/server";
import { larkClient } from "@/lib/lark-client";
import { requireAuth } from "@/lib/auth-utils";
import { detectFileType, isPdfMimeType } from "@/lib/file-type-detection";

/**
 * GET /api/files/[fileKey]
 *
 * Larkに保存されたファイルをダウンロードして返す
 * 認証済みユーザーのみアクセス可能
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileKey: string } }
) {
  try {
    // 認証チェック
    const authCheck = await requireAuth();
    if (!authCheck.authorized) {
      console.warn(`[File API] Unauthorized access attempt - fileKey: ${params.fileKey}`);
      return authCheck.response;
    }

    const { fileKey } = params;

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    // アクセスログ記録
    console.log(`[File API] Access granted - user: ${authCheck.userId}, fileKey: ${fileKey}`);

    // Larkからファイルをダウンロード
    const response = await larkClient.im.file.get({
      path: {
        file_key: fileKey,
      },
    });

    if (!response.success || !response.data?.file) {
      console.error(`[File API] Failed to download - fileKey: ${fileKey}, user: ${authCheck.userId}`);
      return NextResponse.json(
        { error: "Failed to download file from Lark" },
        { status: 500 }
      );
    }

    const fileBuffer = response.data.file;

    // マジックバイトからファイルタイプを検出
    const detectedType = detectFileType(fileBuffer);
    const contentType = detectedType.mimeType;

    console.log(`[File API] Detected content type: ${contentType} for fileKey: ${fileKey}`);

    // PDFの場合はインライン表示を許可
    const contentDisposition = isPdfMimeType(contentType)
      ? "inline"
      : "inline";

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
