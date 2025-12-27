import BoxSDK from "box-node-sdk";
import { Readable } from "stream";

// Box クライアント（遅延初期化）
let _boxClient: any = null;

/**
 * Box認証設定を取得
 */
function getBoxConfig() {
  const clientId = process.env.BOX_CLIENT_ID;
  const clientSecret = process.env.BOX_CLIENT_SECRET;
  const enterpriseId = process.env.BOX_ENTERPRISE_ID;
  const publicKeyId = process.env.BOX_PUBLIC_KEY_ID;
  const privateKey = process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const passphrase = process.env.BOX_PASSPHRASE || "";

  return {
    clientId,
    clientSecret,
    enterpriseId,
    publicKeyId,
    privateKey,
    passphrase,
  };
}

/**
 * Boxクライアントを取得（JWT認証）
 */
export function getBoxClient(): any {
  const config = getBoxConfig();

  // Developer Token認証（開発用・簡易設定）
  if (process.env.BOX_DEVELOPER_TOKEN) {
    if (!_boxClient) {
      const sdk = new BoxSDK({
        clientID: config.clientId || "",
        clientSecret: config.clientSecret || "",
      });
      _boxClient = sdk.getBasicClient(process.env.BOX_DEVELOPER_TOKEN);
      console.log("[box-client] Initialized with Developer Token");
    }
    return _boxClient;
  }

  // JWT認証（本番用）
  if (!config.clientId || !config.clientSecret || !config.enterpriseId) {
    console.error("[box-client] Missing Box configuration");
    return null;
  }

  if (!_boxClient) {
    try {
      const sdk = BoxSDK.getPreconfiguredInstance({
        boxAppSettings: {
          clientID: config.clientId,
          clientSecret: config.clientSecret,
          appAuth: {
            publicKeyID: config.publicKeyId || "",
            privateKey: config.privateKey || "",
            passphrase: config.passphrase,
          },
        },
        enterpriseID: config.enterpriseId,
      });
      _boxClient = sdk.getAppAuthClient("enterprise", config.enterpriseId);
      console.log("[box-client] Initialized with JWT Auth");
    } catch (error) {
      console.error("[box-client] Failed to initialize:", error);
      return null;
    }
  }

  return _boxClient;
}

/**
 * 保存先フォルダIDを取得
 */
export function getBoxFolderId(): string {
  return process.env.BOX_FOLDER_ID || "0"; // "0" はルートフォルダ
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

    // ファイルをアップロード
    const file = await client.files.uploadFile(folderId, filename, stream);

    if (!file || !file.entries || !file.entries[0]) {
      return { success: false, error: "Upload failed - no file ID returned" };
    }

    const fileId = file.entries[0].id;
    console.log(`[box-client] Upload successful - fileId: ${fileId}`);

    return {
      success: true,
      file_id: fileId,
    };
  } catch (error: any) {
    console.error("[box-client] Upload error:", error);

    // 同名ファイルが存在する場合は新バージョンとしてアップロード
    if (error.statusCode === 409 && error.response?.body?.context_info?.conflicts) {
      const existingFileId = error.response.body.context_info.conflicts.id;
      try {
        const stream = Readable.from(buffer);
        const file = await getBoxClient().files.uploadNewFileVersion(existingFileId, stream);
        return {
          success: true,
          file_id: file.entries[0].id,
        };
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

    // ファイルをダウンロード（ReadableStreamを取得）
    const stream = await client.files.getReadStream(fileId);

    // Streamをバッファに変換
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    const buffer = Buffer.concat(chunks);
    console.log(`[box-client] Download successful - size: ${buffer.length}`);

    return buffer;
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

    const file = await client.files.update(fileId, {
      shared_link: {
        access: "open",
      },
    });

    return file.shared_link?.url || null;
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

    await client.files.delete(fileId);
    console.log(`[box-client] File deleted: ${fileId}`);
    return true;
  } catch (error) {
    console.error("[box-client] Delete error:", error);
    return false;
  }
}
