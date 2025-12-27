import { Readable } from "stream";

// box-node-sdk v3+ は名前付きエクスポートを使用
/* eslint-disable */
const { BoxClient, BoxDeveloperTokenAuth, BoxJwtAuth, JwtConfig } = require("box-node-sdk");
/* eslint-enable */

// Box クライアント（遅延初期化）
let _boxClient: any = null;
let _boxFolderId: string = "0";
let _configSource: "env" | "db" = "env";

/**
 * Box設定の型定義
 */
export interface BoxConfig {
  clientId: string;
  clientSecret: string;
  enterpriseId: string;
  folderId: string;
  developerToken?: string;
  publicKeyId?: string;
  privateKey?: string;
  passphrase?: string;
}

/**
 * Box認証設定を環境変数から取得
 */
function getBoxConfigFromEnv(): BoxConfig {
  return {
    clientId: process.env.BOX_CLIENT_ID || "",
    clientSecret: process.env.BOX_CLIENT_SECRET || "",
    enterpriseId: process.env.BOX_ENTERPRISE_ID || "",
    folderId: process.env.BOX_FOLDER_ID || "0",
    developerToken: process.env.BOX_DEVELOPER_TOKEN,
    publicKeyId: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    passphrase: process.env.BOX_PASSPHRASE || "",
  };
}

/**
 * DB設定でBoxクライアントを初期化
 * @param config DB設定から取得したBox設定
 */
export function initializeBoxClientWithConfig(config: BoxConfig): boolean {
  try {
    // 既存のクライアントをリセット
    _boxClient = null;
    _boxFolderId = config.folderId || "0";
    _configSource = "db";

    // Developer Token認証（開発用・簡易設定）
    if (config.developerToken) {
      const auth = new BoxDeveloperTokenAuth({ token: config.developerToken });
      _boxClient = new BoxClient({ auth });
      console.log("[box-client] Initialized with Developer Token from DB config");
      return true;
    }

    // JWT認証（本番用）
    if (!config.clientId || !config.clientSecret || !config.enterpriseId) {
      console.error("[box-client] Missing Box configuration from DB");
      return false;
    }

    // JWT設定を構築
    const jwtConfig = new JwtConfig({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      enterpriseId: config.enterpriseId,
      jwtKeyId: config.publicKeyId || "",
      privateKey: config.privateKey || "",
      privateKeyPassphrase: config.passphrase || "",
    });
    const auth = new BoxJwtAuth({ config: jwtConfig });
    _boxClient = new BoxClient({ auth });
    console.log("[box-client] Initialized with JWT Auth from DB config");
    return true;
  } catch (error) {
    console.error("[box-client] Failed to initialize with DB config:", error);
    return false;
  }
}

/**
 * Boxクライアントをリセット（設定変更時に使用）
 */
export function resetBoxClient(): void {
  _boxClient = null;
  _configSource = "env";
  console.log("[box-client] Client reset");
}

/**
 * Boxクライアントを取得（JWT認証）
 * DB設定で初期化済みの場合はそれを使用、そうでなければ環境変数から初期化
 */
export function getBoxClient(): any {
  // 既に初期化済みの場合はそのまま返す
  if (_boxClient) {
    return _boxClient;
  }

  // 環境変数から設定を取得して初期化
  const config = getBoxConfigFromEnv();

  // Developer Token認証（開発用・簡易設定）
  if (config.developerToken) {
    const auth = new BoxDeveloperTokenAuth({ token: config.developerToken });
    _boxClient = new BoxClient({ auth });
    _boxFolderId = config.folderId;
    console.log("[box-client] Initialized with Developer Token from env");
    return _boxClient;
  }

  // JWT認証（本番用）
  if (!config.clientId || !config.clientSecret || !config.enterpriseId) {
    console.error("[box-client] Missing Box configuration");
    return null;
  }

  try {
    // JWT設定を構築
    const jwtConfig = new JwtConfig({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      enterpriseId: config.enterpriseId,
      jwtKeyId: config.publicKeyId || "",
      privateKey: config.privateKey || "",
      privateKeyPassphrase: config.passphrase || "",
    });
    const auth = new BoxJwtAuth({ config: jwtConfig });
    _boxClient = new BoxClient({ auth });
    _boxFolderId = config.folderId;
    console.log("[box-client] Initialized with JWT Auth from env");
  } catch (error) {
    console.error("[box-client] Failed to initialize:", error);
    return null;
  }

  return _boxClient;
}

/**
 * 保存先フォルダIDを取得
 */
export function getBoxFolderId(): string {
  return _boxFolderId || process.env.BOX_FOLDER_ID || "0"; // "0" はルートフォルダ
}

/**
 * 現在の設定ソースを取得
 */
export function getBoxConfigSource(): "env" | "db" {
  return _configSource;
}

/**
 * Boxにファイルをアップロード
 * @param buffer ファイルのBuffer
 * @param filename ファイル名
 * @returns file_id - アップロードされたファイルのID
 */
export async function uploadFileToBox(
  buffer: Buffer,
  filename: string
): Promise<{ success: boolean; file_id?: string; error?: string }> {
  try {
    const client = getBoxClient();
    if (!client) {
      return { success: false, error: "Box client not initialized" };
    }

    const folderId = getBoxFolderId();

    console.log(`[box-client] Uploading file: ${filename} to folder: ${folderId}`);

    // BufferをReadable Streamに変換
    const stream = Readable.from(buffer);

    // Box SDK v3のアップロードAPI
    const result = await client.uploads.uploadFile({
      attributes: {
        name: filename,
        parent: { id: folderId },
      },
      file: stream,
    });

    // レスポンス形式: { entries: [{ id: '...', ... }] }
    if (!result || !result.entries || !result.entries[0] || !result.entries[0].id) {
      return { success: false, error: "Upload failed - no file ID returned" };
    }

    const fileId = result.entries[0].id;
    console.log(`[box-client] Upload successful - fileId: ${fileId}`);

    return {
      success: true,
      file_id: fileId,
    };
  } catch (error: any) {
    console.error("[box-client] Upload error:", error);

    // 同名ファイルが存在する場合は新バージョンとしてアップロード
    if (error.statusCode === 409 || error.message?.includes("item_name_in_use")) {
      try {
        // エラーからファイルIDを取得
        const conflictInfo = error.context_info?.conflicts || error.response?.body?.context_info?.conflicts;
        if (conflictInfo?.id) {
          const existingFileId = conflictInfo.id;
          const stream = Readable.from(buffer);
          const versionResult = await getBoxClient().uploads.uploadFileVersion({
            fileId: existingFileId,
            file: stream,
          });
          // レスポンス形式: { entries: [{ id: '...', ... }] }
          const versionFileId = versionResult?.entries?.[0]?.id || existingFileId;
          return {
            success: true,
            file_id: versionFileId,
          };
        }
      } catch (versionError) {
        console.error("[box-client] Version upload error:", versionError);
        return { success: false, error: "Failed to upload new version" };
      }
    }

    return {
      success: false,
      error: error.message || "Upload failed",
    };
  }
}

/**
 * Boxからファイルをダウンロード
 * @param fileId ファイルID
 * @returns ファイルデータ（Buffer）
 */
export async function downloadFileFromBox(fileId: string): Promise<Buffer | null> {
  try {
    const client = getBoxClient();
    if (!client) {
      console.error("[box-client] Client not initialized");
      return null;
    }

    console.log(`[box-client] Downloading file: ${fileId}`);

    // Box SDK v3のダウンロードAPI
    const response = await client.downloads.downloadFile(fileId);

    // レスポンスをBufferに変換
    if (Buffer.isBuffer(response)) {
      console.log(`[box-client] Download successful - size: ${response.length}`);
      return response;
    }

    // ReadableStreamの場合
    if (response && typeof response[Symbol.asyncIterator] === 'function') {
      const chunks: Buffer[] = [];
      for await (const chunk of response) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      console.log(`[box-client] Download successful - size: ${buffer.length}`);
      return buffer;
    }

    // ArrayBufferの場合
    if (response instanceof ArrayBuffer) {
      const buffer = Buffer.from(response);
      console.log(`[box-client] Download successful - size: ${buffer.length}`);
      return buffer;
    }

    console.error("[box-client] Unknown response type:", typeof response);
    return null;
  } catch (error) {
    console.error("[box-client] Download error:", error);
    return null;
  }
}

/**
 * Boxファイルの共有リンクを取得
 * @param fileId ファイルID
 * @returns 共有URL
 */
export async function getBoxFileSharedLink(fileId: string): Promise<string | null> {
  try {
    const client = getBoxClient();
    if (!client) {
      return null;
    }

    // Box SDK v3のファイル更新API
    const file = await client.sharedLinks.files.addShareLink(fileId, {
      shared_link: {
        access: "open",
      },
      fields: ["shared_link"],
    });

    return file.sharedLink?.url || null;
  } catch (error) {
    console.error("[box-client] Failed to get shared link:", error);
    return null;
  }
}

/**
 * Boxファイルを削除
 * @param fileId ファイルID
 */
export async function deleteBoxFile(fileId: string): Promise<boolean> {
  try {
    const client = getBoxClient();
    if (!client) {
      return false;
    }

    // Box SDK v3のファイル削除API
    await client.files.deleteFileById(fileId);
    console.log(`[box-client] File deleted: ${fileId}`);
    return true;
  } catch (error) {
    console.error("[box-client] Delete error:", error);
    return false;
  }
}
