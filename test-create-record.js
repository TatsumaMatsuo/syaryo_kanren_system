// テスト用：Lark Baseにレコードを直接作成
const lark = require("@larksuiteoapi/node-sdk");

const client = new lark.Client({
  appId: "cli_a9c353d3c3b81e1c",
  appSecret: "3poxwhPwSz179YcXtaYslgKbSMkRoQwB",
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Feishu,
});

async function testCreateRecord() {
  try {
    console.log("=== Lark Base 書き込み権限テスト ===\n");
    console.log("ステップ1: レコード作成を試みます...");

    // 日付をUnixタイムスタンプ（ミリ秒）に変換
    const expirationDate = new Date("2027-12-31");
    const expirationTimestamp = expirationDate.getTime();

    const response = await client.bitable.appTableRecord.create({
      path: {
        app_token: "NNLCbCdohajZpYsHCrkjy1adpNX",
        table_id: "tblMmtpXHTwxPPHH", // drivers_licenses
      },
      data: {
        fields: {
          employee_id: "EMP001",
          license_number: "TEST123456789",
          license_type: "普通",
          expiration_date: expirationTimestamp,
          status: "temporary",
          approval_status: "pending",
        },
      },
    });

    console.log("\n✅ 成功！レコードが作成されました");
    console.log("レスポンス:", JSON.stringify(response, null, 2));

    if (response.data?.record?.record_id) {
      console.log("\n作成されたレコードID:", response.data.record.record_id);
      console.log("\nLark Baseでテーブルを確認してください！");
    }
  } catch (error) {
    console.error("\n❌ エラーが発生しました");
    console.error("エラーメッセージ:", error.message);

    if (error.response?.data) {
      console.error("\n詳細情報:");
      console.error(JSON.stringify(error.response.data, null, 2));

      // エラーコードの解説
      if (error.response.data.code === 99991663) {
        console.error("\n⚠️  権限エラー:");
        console.error("   このアプリにはBaseへの書き込み権限がありません");
        console.error("\n解決方法:");
        console.error("1. Lark Developer Console (https://open.larksuite.com/) を開く");
        console.error("2. アプリ「車両関連管理システム」を選択");
        console.error("3. 「Permissions & Scopes」タブを開く");
        console.error("4. 以下の権限を追加:");
        console.error("   - bitable:record:write");
        console.error("5. アプリを再公開（Publish）");
        console.error("6. Baseの設定でアプリを追加");
      }
    } else {
      console.error("詳細:", error);
    }
  }
}

testCreateRecord();
