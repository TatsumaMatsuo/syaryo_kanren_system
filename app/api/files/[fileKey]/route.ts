import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { downloadFileFromBox } from "@/lib/box-client";
import { downloadFileFromLark } from "@/lib/lark-client";
import { detectFileType } from "@/lib/file-type-detection";
import fs from "fs";
import path from "path";

// ローカルファイル保存ディレクトリ（後方互換性用）
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * ファイルキーの種類を判定
 */
function getFileKeyType(fileKey: string): "box" | "lark" | "local" {
  if (fileKey.startsWith("box_")) {
    return "box";
  }
  if (fileKey.startsWith("file_")) {
    return "lark";
  }
  return "local";
}

/**
 * GET /api/files/[fileKey]
 *
 * ファイルを取得（Box / Lark / ローカルストレージから）
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

    const keyType = getFileKeyType(fileKey);
    console.log(`[File API] Request - user: ${authCheck.userId}, fileKey: ${fileKey}, type: ${keyType}`);

    let fileBuffer: Buffer;
    let contentType = "application/octet-stream";

    if (keyType === "box") {
      // Boxからダウンロード
      const boxFileId = fileKey.replace("box_", "");
      console.log(`[File API] Fetching from Box - fileId: ${boxFileId}`);

      try {
        const buffer = await downloadFileFromBox(boxFileId);

        if (!buffer) {
          console.error(`[File API] Box download returned null - fileKey: ${fileKey}`);
          return NextResponse.json(
            { error: "File not found in Box" },
            { status: 404 }
          );
        }

        fileBuffer = buffer;

        // マジックバイトからファイルタイプを検出
        const detectedType = detectFileType(fileBuffer);
        contentType = detectedType.mimeType;

        console.log(`[File API] Box file retrieved - size: ${fileBuffer.length}, type: ${contentType}`);
      } catch (boxError) {
        console.error(`[File API] Box download error:`, boxError);
        return NextResponse.json(
          { error: "Failed to download file from Box" },
          { status: 500 }
        );
      }
    } else if (keyType === "lark") {
      // Lark IM File APIからダウンロード（後方互換性）
      console.log(`[File API] Fetching from Lark - fileKey: ${fileKey}`);

      try {
        const buffer = await downloadFileFromLark(fileKey);

        if (!buffer) {
          console.error(`[File API] Lark download returned null - fileKey: ${fileKey}`);
          return NextResponse.json(
            { error: "File not found in Lark" },
            { status: 404 }
          );
        }

        fileBuffer = buffer;

        // マジックバイトからファイルタイプを検出
        const detectedType = detectFileType(fileBuffer);
        contentType = detectedType.mimeType;

        console.log(`[File API] Lark file retrieved - size: ${fileBuffer.length}, type: ${contentType}`);
      } catch (larkError) {
        console.error(`[File API] Lark download error:`, larkError);
        return NextResponse.json(
          { error: "Failed to download file from Lark" },
          { status: 500 }
        );
      }
    } else {
      // ローカルストレージから取得（後方互換性）
      console.log(`[File API] Fetching from local storage - fileKey: ${fileKey}`);

      // パストラバーサル攻撃の防止
      const sanitizedFileKey = path.basename(fileKey);
      const filePath = path.join(UPLOAD_DIR, sanitizedFileKey);

      // ファイルが存在するか確認
      if (!fs.existsSync(filePath)) {
        console.warn(`[File API] Local file not found - fileKey: ${fileKey}`);
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }

      // ファイルを読み込み
      fileBuffer = fs.readFileSync(filePath);

      // マジックバイトからファイルタイプを検出
      const detectedType = detectFileType(fileBuffer);
      contentType = detectedType.mimeType;

      console.log(`[File API] Local file retrieved - size: ${fileBuffer.length}, type: ${contentType}`);
    }

    // アクセスログ記録
    console.log(`[File API] Access granted - user: ${authCheck.userId}, fileKey: ${fileKey}, type: ${contentType}`);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
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
