import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { uploadFileToBox } from "@/lib/box-client";
import crypto from "crypto";

/**
 * ファイルアップロードAPI
 * POST /api/upload
 * 認証済みユーザーのみアップロード可能
 * Box APIを使用してクラウドストレージに保存
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

    // ファイルをBufferに変換
    const buffer = Buffer.from(await file.arrayBuffer());

    // ユニークなファイル名を生成（Box用）
    const uniqueId = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFilename = `${uniqueId}_${sanitizedName}`;

    console.log(`[Upload API] Uploading to Box - user: ${authCheck.userId}, file: ${file.name}`);

    // Boxにアップロード
    const result = await uploadFileToBox(buffer, uniqueFilename);

    if (!result.success || !result.file_id) {
      console.error("[Upload API] Box upload failed:", result.error);
      return NextResponse.json(
        { success: false, error: result.error || "Boxへのアップロードに失敗しました" },
        { status: 500 }
      );
    }

    // アップロード成功ログ
    // file_keyは "box_" プレフィックスを付けてBox識別子とする
    const fileKey = `box_${result.file_id}`;
    console.log(`[Upload API] Success - user: ${authCheck.userId}, file: ${file.name}, box_id: ${result.file_id}`);

    return NextResponse.json({
      success: true,
      file_key: fileKey,
      message: "ファイルのアップロードに成功しました",
    });
  } catch (error) {
    console.error("[Upload API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "ファイルのアップロードに失敗しました",
      },
      { status: 500 }
    );
  }
}
