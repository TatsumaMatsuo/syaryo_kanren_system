import { NextRequest, NextResponse } from "next/server";
import { larkClient } from "@/lib/lark-client";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * ファイルアップロードAPI
 * POST /api/upload
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    // ファイルサイズチェック（10MB制限）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "ファイルサイズが大きすぎます（最大10MB）" },
        { status: 400 }
      );
    }

    // ファイルタイプチェック
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "サポートされていないファイル形式です（JPEG、PNG、PDFのみ）",
        },
        { status: 400 }
      );
    }

    // ファイルを一時ディレクトリに保存
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `upload_${Date.now()}_${file.name}`);
    fs.writeFileSync(tempFilePath, buffer);

    try {
      // Larkにファイルをアップロード
      const fileExtension = path.extname(file.name).slice(1).toLowerCase();
      const response = await larkClient.im.file.create({
        data: {
          file_type: fileExtension,
          file_name: file.name,
          file: fs.readFileSync(tempFilePath),
        },
      });

      // 一時ファイルを削除
      fs.unlinkSync(tempFilePath);

      if (!response.success) {
        console.error("Lark file upload failed:", response);
        return NextResponse.json(
          { success: false, error: "ファイルのアップロードに失敗しました" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        file_key: response.data?.file_key,
        message: "ファイルのアップロードに成功しました",
      });
    } catch (uploadError) {
      // エラー時は一時ファイルを削除
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw uploadError;
    }
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "ファイルのアップロードに失敗しました",
      },
      { status: 500 }
    );
  }
}
