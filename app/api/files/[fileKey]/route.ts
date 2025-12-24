import { NextRequest, NextResponse } from "next/server";
import { larkClient } from "@/lib/lark-client";

/**
 * GET /api/files/[fileKey]
 *
 * Larkに保存されたファイルをダウンロードして返す
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileKey: string } }
) {
  try {
    const { fileKey } = params;

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    // Larkからファイルをダウンロード
    const response = await larkClient.im.file.get({
      path: {
        file_key: fileKey,
      },
    });

    if (!response.success || !response.data?.file) {
      return NextResponse.json(
        { error: "Failed to download file from Lark" },
        { status: 500 }
      );
    }

    const fileBuffer = response.data.file;

    // Content-Typeを推測（file_keyから拡張子を取得できない場合のフォールバック）
    // 実際のMIMEタイプは別途管理が必要な場合があります
    const contentType = "image/jpeg"; // デフォルト

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Failed to fetch file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
