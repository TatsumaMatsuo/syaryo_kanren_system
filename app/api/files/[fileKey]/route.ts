import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { downloadFileFromLark } from "@/lib/lark-client";
import { detectFileType } from "@/lib/file-type-detection";
import fs from "fs";
import path from "path";

// ローカルファイル保存ディレクトリ（後方互換性用）
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * Lark file_keyかローカルファイル名かを判定
 * Lark file_keyは通常 "file_xxxxxx" 形式
 */
function isLarkFileKey(fileKey: string): boolean {
  // Larkのfile_keyは "file_" で始まる
  return fileKey.startsWith("file_");
}

/**
 * GET /api/files/[fileKey]
 *
 * ファイルを取得（Lark IM File API または ローカルストレージから）
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

    console.log(`[File API] Request - user: ${authCheck.userId}, fileKey: ${fileKey}`);

    let fileBuffer: Buffer;
    let contentType = "application/octet-stream";

    if (isLarkFileKey(fileKey)) {
      // Lark IM File APIからダウンロード
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

    return new NextResponse(fileBuffer, {
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
