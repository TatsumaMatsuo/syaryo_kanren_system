import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// ローカルファイル保存ディレクトリ
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * ファイルアップロードAPI
 * POST /api/upload
 * 認証済みユーザーのみアップロード可能
 * ローカルファイルストレージを使用
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authCheck = await requireAuth();
    if (!authCheck.authorized) {
      console.warn("[Upload API] Unauthorized upload attempt");
      return authCheck.response;
    }

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

    // uploadsディレクトリが存在しない場合は作成
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // ユニークなファイルキーを生成
    const fileExtension = path.extname(file.name).toLowerCase();
    const fileKey = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileKey);

    // ファイルを保存
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // アップロード成功ログ
    console.log(`[Upload API] Success - user: ${authCheck.userId}, file: ${file.name}, key: ${fileKey}`);

    return NextResponse.json({
      success: true,
      file_key: fileKey,
      message: "ファイルのアップロードに成功しました",
    });
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
