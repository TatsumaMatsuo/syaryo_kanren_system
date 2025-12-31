import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { uploadFileToBox, initializeBoxClientWithConfig } from "@/lib/box-client";
import { getFileStorageSettings } from "@/services/system-settings.service";
import crypto from "crypto";
import fs from "fs";
import path from "path";

/**
 * ストレージパスを解決（相対パスの場合はcwdを基準に）
 */
function resolveStoragePath(storagePath: string): string {
  if (path.isAbsolute(storagePath)) {
    return storagePath;
  }
  return path.join(process.cwd(), storagePath);
}

/**
 * ローカルストレージにファイルを保存
 */
async function uploadFileToLocal(
  buffer: Buffer,
  filename: string,
  storagePath: string
): Promise<{ success: boolean; file_key?: string; error?: string }> {
  try {
    const uploadDir = resolveStoragePath(storagePath);

    // アップロードディレクトリが存在しない場合は作成
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    console.log(`[Upload API] Local file saved: ${filePath}`);
    return { success: true, file_key: filename };
  } catch (error: any) {
    console.error("[Upload API] Local save error:", error);
    return { success: false, error: error.message || "Failed to save file locally" };
  }
}

/**
 * ファイルアップロードAPI
 * POST /api/upload
 * 認証済みユーザーのみアップロード可能
 * システム設定に応じてBox/Lark/ローカルストレージに保存
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

    // ユニークなファイル名を生成
    const uniqueId = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFilename = `${uniqueId}_${sanitizedName}`;

    // ストレージ設定を取得
    const storageSettings = await getFileStorageSettings();
    const storageType = storageSettings.storage_type;

    console.log(`[Upload API] Storage type: ${storageType}, user: ${authCheck.userId}, file: ${file.name}`);

    let fileKey: string;

    if (storageType === "box") {
      // Box設定でクライアントを初期化
      // 環境変数のトークンを優先（開発時に便利）
      const envToken = process.env.BOX_DEVELOPER_TOKEN?.trim();
      const dbToken = storageSettings.box_developer_token?.trim();
      // 空文字列やプレースホルダーは無効として扱う
      const validEnvToken = envToken && envToken !== "your_developer_token_here" && envToken.length > 10 ? envToken : null;
      const validDbToken = dbToken && dbToken.length > 10 ? dbToken : null;
      const developerToken = validEnvToken || validDbToken;

      console.log(`[Upload API] Token source: env=${validEnvToken ? "valid" : "empty"}, db=${validDbToken ? "valid" : "empty"}, using=${developerToken ? "devToken" : "JWT"}`);

      // JWT認証またはDeveloper Token認証でクライアントを初期化
      if (storageSettings.box_client_id || developerToken) {
        initializeBoxClientWithConfig({
          clientId: storageSettings.box_client_id || process.env.BOX_CLIENT_ID || "",
          clientSecret: storageSettings.box_client_secret || process.env.BOX_CLIENT_SECRET || "",
          enterpriseId: storageSettings.box_enterprise_id || process.env.BOX_ENTERPRISE_ID || "",
          folderId: storageSettings.box_folder_id || process.env.BOX_FOLDER_ID || "0",
          publicKeyId: process.env.BOX_PUBLIC_KEY_ID || "",
          privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
          passphrase: process.env.BOX_PASSPHRASE || "",
          developerToken: developerToken || undefined,
        });
      }

      // Boxにアップロード
      const result = await uploadFileToBox(buffer, uniqueFilename);

      if (!result.success || !result.file_id) {
        console.error("[Upload API] Box upload failed:", result.error);
        return NextResponse.json(
          { success: false, error: result.error || "Boxへのアップロードに失敗しました" },
          { status: 500 }
        );
      }

      fileKey = `box_${result.file_id}`;
      console.log(`[Upload API] Box upload success - box_id: ${result.file_id}`);

    } else {
      // ローカルストレージに保存
      const localPath = storageSettings.local_storage_path || "./uploads";
      const result = await uploadFileToLocal(buffer, uniqueFilename, localPath);

      if (!result.success || !result.file_key) {
        console.error("[Upload API] Local save failed:", result.error);
        return NextResponse.json(
          { success: false, error: result.error || "ローカル保存に失敗しました" },
          { status: 500 }
        );
      }

      fileKey = result.file_key;
      console.log(`[Upload API] Local save success - file_key: ${fileKey}`);
    }

    return NextResponse.json({
      success: true,
      file_key: fileKey,
      storage_type: storageType,
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
