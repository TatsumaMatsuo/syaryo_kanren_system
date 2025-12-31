import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { downloadFileFromBox, initializeBoxClientWithConfig } from "@/lib/box-client";
import { downloadFileFromLark } from "@/lib/lark-client";
import { detectFileType } from "@/lib/file-type-detection";
import { getFileStorageSettings } from "@/services/system-settings.service";
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
 * Box clientをDB設定で初期化（アップロードと同じ認証方法を使用）
 */
async function ensureBoxClientInitialized(): Promise<void> {
  try {
    const storageSettings = await getFileStorageSettings();

    // 環境変数のトークンを優先（開発時に便利）
    const envToken = process.env.BOX_DEVELOPER_TOKEN?.trim();
    const dbToken = storageSettings.box_developer_token?.trim();
    // 空文字列やプレースホルダーは無効として扱う
    const validEnvToken = envToken && envToken !== "your_developer_token_here" && envToken.length > 10 ? envToken : null;
    const validDbToken = dbToken && dbToken.length > 10 ? dbToken : null;
    const developerToken = validEnvToken || validDbToken;

    console.log(`[File API] Box init - token source: env=${validEnvToken ? "valid" : "empty"}, db=${validDbToken ? "valid" : "empty"}, using=${developerToken ? "devToken" : "JWT"}`);

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
  } catch (error) {
    console.error("[File API] Failed to initialize Box client:", error);
  }
}

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

      // DB設定でBox clientを初期化（アップロード時と同じ認証方法を使用）
      await ensureBoxClientInitialized();

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
      // ローカルストレージから取得
      console.log(`[File API] Fetching from local storage - fileKey: ${fileKey}`);

      // ストレージ設定からパスを取得
      const storageSettings = await getFileStorageSettings();
      const localPath = storageSettings.local_storage_path || "./uploads";
      const uploadDir = resolveStoragePath(localPath);

      // パストラバーサル攻撃の防止
      const sanitizedFileKey = path.basename(fileKey);
      const filePath = path.join(uploadDir, sanitizedFileKey);

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

/**
 * HEAD /api/files/[fileKey]
 *
 * ファイルのContent-Typeを取得（ボディなし）
 * PDF/画像判定のために使用
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ fileKey: string }> }
) {
  try {
    // 認証チェック
    const authCheck = await requireAuth();
    if (!authCheck.authorized) {
      const resolvedParams = await params;
      console.warn(`[File API HEAD] Unauthorized access attempt - fileKey: ${resolvedParams.fileKey}`);
      return authCheck.response;
    }

    const resolvedParams = await params;
    const { fileKey } = resolvedParams;

    if (!fileKey) {
      return new NextResponse(null, { status: 400 });
    }

    const keyType = getFileKeyType(fileKey);
    console.log(`[File API HEAD] Request - user: ${authCheck.userId}, fileKey: ${fileKey}, type: ${keyType}`);

    let contentType = "application/octet-stream";

    if (keyType === "box") {
      // Boxからダウンロードしてタイプ検出
      const boxFileId = fileKey.replace("box_", "");
      // DB設定でBox clientを初期化（アップロード時と同じ認証方法を使用）
      await ensureBoxClientInitialized();
      try {
        const buffer = await downloadFileFromBox(boxFileId);
        if (buffer) {
          const detectedType = detectFileType(buffer);
          contentType = detectedType.mimeType;
        }
      } catch (boxError) {
        console.error(`[File API HEAD] Box error:`, boxError);
        return new NextResponse(null, { status: 404 });
      }
    } else if (keyType === "lark") {
      // Larkからダウンロードしてタイプ検出
      try {
        const buffer = await downloadFileFromLark(fileKey);
        if (buffer) {
          const detectedType = detectFileType(buffer);
          contentType = detectedType.mimeType;
        }
      } catch (larkError) {
        console.error(`[File API HEAD] Lark error:`, larkError);
        return new NextResponse(null, { status: 404 });
      }
    } else {
      // ローカルストレージ
      const storageSettings = await getFileStorageSettings();
      const localPath = storageSettings.local_storage_path || "./uploads";
      const uploadDir = resolveStoragePath(localPath);

      const sanitizedFileKey = path.basename(fileKey);
      const filePath = path.join(uploadDir, sanitizedFileKey);

      if (!fs.existsSync(filePath)) {
        return new NextResponse(null, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(filePath);
      const detectedType = detectFileType(fileBuffer);
      contentType = detectedType.mimeType;
    }

    console.log(`[File API HEAD] Response - fileKey: ${fileKey}, type: ${contentType}`);

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[File API HEAD] Internal error:", error);
    return new NextResponse(null, { status: 500 });
  }
}
