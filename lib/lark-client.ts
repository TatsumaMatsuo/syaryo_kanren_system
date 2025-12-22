import * as lark from "@larksuiteoapi/node-sdk";

// Lark クライアント設定
export const larkClient = new lark.Client({
  appId: process.env.LARK_APP_ID || "",
  appSecret: process.env.LARK_APP_SECRET || "",
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Feishu,
});

// Lark Base トークン
export const LARK_BASE_TOKEN = process.env.LARK_BASE_TOKEN || "";

/**
 * Lark Baseからレコードを取得
 */
export async function getBaseRecords(tableId: string, params?: {
  filter?: string;
  sort?: string[];
  pageSize?: number;
  pageToken?: string;
}) {
  try {
    const response = await larkClient.bitable.appTableRecord.list({
      path: {
        app_token: LARK_BASE_TOKEN,
        table_id: tableId,
      },
      params: {
        filter: params?.filter,
        sort: params?.sort ? JSON.stringify(params.sort) : undefined,
        page_size: params?.pageSize || 100,
        page_token: params?.pageToken,
      },
    });

    return response;
  } catch (error) {
    console.error("Error fetching Lark Base records:", error);
    throw error;
  }
}

/**
 * Lark Baseにレコードを作成
 */
export async function createBaseRecord(tableId: string, fields: Record<string, any>) {
  try {
    const response = await larkClient.bitable.appTableRecord.create({
      path: {
        app_token: LARK_BASE_TOKEN,
        table_id: tableId,
      },
      data: {
        fields,
      },
    });

    return response;
  } catch (error) {
    console.error("Error creating Lark Base record:", error);
    throw error;
  }
}

/**
 * Lark Baseのレコードを更新
 */
export async function updateBaseRecord(
  tableId: string,
  recordId: string,
  fields: Record<string, any>
) {
  try {
    const response = await larkClient.bitable.appTableRecord.update({
      path: {
        app_token: LARK_BASE_TOKEN,
        table_id: tableId,
        record_id: recordId,
      },
      data: {
        fields,
      },
    });

    return response;
  } catch (error) {
    console.error("Error updating Lark Base record:", error);
    throw error;
  }
}

/**
 * Lark Baseのレコードを削除（論理削除）
 */
export async function deleteBaseRecord(tableId: string, recordId: string) {
  try {
    // 論理削除：deleted_flagを更新
    const response = await updateBaseRecord(tableId, recordId, {
      deleted_flag: true,
      deleted_at: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    console.error("Error deleting Lark Base record:", error);
    throw error;
  }
}

/**
 * Lark Baseのレコードを物理削除
 */
export async function hardDeleteBaseRecord(tableId: string, recordId: string) {
  try {
    const response = await larkClient.bitable.appTableRecord.delete({
      path: {
        app_token: LARK_BASE_TOKEN,
        table_id: tableId,
        record_id: recordId,
      },
    });

    return response;
  } catch (error) {
    console.error("Error hard deleting Lark Base record:", error);
    throw error;
  }
}

/**
 * Lark Baseのテーブル一覧を取得
 */
export async function getBaseTables() {
  try {
    const response = await larkClient.bitable.appTable.list({
      path: {
        app_token: LARK_BASE_TOKEN,
      },
    });

    return response;
  } catch (error) {
    console.error("Error fetching Lark Base tables:", error);
    throw error;
  }
}

/**
 * Lark Baseにファイルをアップロード
 */
export async function uploadFileToDrive(file: File | Buffer, filename: string) {
  try {
    // TODO: Lark Drive APIを使用してファイルをアップロード
    // 実装は後ほど
    throw new Error("Not implemented yet");
  } catch (error) {
    console.error("Error uploading file to Lark Drive:", error);
    throw error;
  }
}
