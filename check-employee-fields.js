// 社員マスタテーブルのフィールド一覧を取得
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

async function checkTableFields() {
  try {
    console.log("=== 社員マスタテーブル フィールド確認 ===\n");

    const response = await client.bitable.appTableField.list({
      path: {
        app_token: env.LARK_BASE_TOKEN,
        table_id: env.LARK_TABLE_EMPLOYEES,
      },
    });

    console.log("✅ テーブルのフィールド一覧:\n");

    if (response.data?.items) {
      response.data.items.forEach((field, index) => {
        console.log(`${index + 1}. フィールド名: ${field.field_name}`);
        console.log(`   タイプ: ${field.type} (${getFieldTypeName(field.type)})`);
        console.log(`   ID: ${field.field_id}`);
        console.log("");
      });

      console.log(`合計 ${response.data.items.length} 個のフィールドが見つかりました\n`);
    } else {
      console.log("フィールドが見つかりませんでした");
    }
  } catch (error) {
    console.error("❌ エラー:", error.message);
    if (error.response?.data) {
      console.error("詳細:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

function getFieldTypeName(type) {
  const types = {
    1: "テキスト",
    2: "数値",
    3: "単一選択",
    4: "複数選択",
    5: "日付",
    7: "チェックボックス",
    11: "ユーザー",
    13: "電話番号",
    15: "URL",
    17: "添付ファイル",
    1001: "日付時刻",
    1004: "メール"
  };
  return types[type] || "不明";
}

checkTableFields();
