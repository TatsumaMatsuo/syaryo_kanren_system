// テスト用：Lark Baseに社員レコードを直接作成
const lark = require("@larksuiteoapi/node-sdk");
const fs = require('fs');
const path = require('path');

// .env.localから環境変数を読み込む
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    env[key] = value;
  }
});

const client = new lark.Client({
  appId: env.LARK_APP_ID,
  appSecret: env.LARK_APP_SECRET,
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Feishu,
});

async function testCreateRecord() {
  try {
    console.log("=== 社員マスタ Lark Base 書き込みテスト ===\n");
    console.log("ステップ1: レコード作成を試みます...");

    // 日付をUnixタイムスタンプ（ミリ秒）に変換
    const hireDate = new Date("2024-04-01");
    const createdAt = new Date();

    const response = await client.bitable.appTableRecord.create({
      path: {
        app_token: env.LARK_BASE_TOKEN,
        table_id: env.LARK_TABLE_EMPLOYEES,
      },
      data: {
        fields: {
          employee_id: "EMP001",
          name: "山田太郎",
          email: "yamada.taro@example.com",
          department: "営業部",
          hire_date: hireDate.getTime(),
          created_at: createdAt.getTime(),
        },
      },
    });

    console.log("\n✅ 成功！レコードが作成されました");
    console.log("レスポンス:", JSON.stringify(response, null, 2));

    if (response.data?.record?.record_id) {
      console.log("\n作成されたレコードID:", response.data.record.record_id);
      console.log("\nLark Baseでテーブルを確認してください！");
      console.log("\n次のステップ:");
      console.log("1. 社員情報を確認: Lark Baseの社員マスタテーブル");
    }
  } catch (error) {
    console.error("\n❌ エラーが発生しました");
    console.error("エラーメッセージ:", error.message);

    if (error.response?.data) {
      console.error("\n詳細情報:");
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("詳細:", error);
    }
  }
}

testCreateRecord();
