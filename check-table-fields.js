// Lark Baseテーブルのフィールド一覧を取得
const lark = require("@larksuiteoapi/node-sdk");

const client = new lark.Client({
  appId: "cli_a9c353d3c3b81e1c",
  appSecret: "3poxwhPwSz179YcXtaYslgKbSMkRoQwB",
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Feishu,
});

async function checkTableFields() {
  try {
    console.log("=== Lark Base テーブルフィールド確認 ===\n");

    const response = await client.bitable.appTableField.list({
      path: {
        app_token: "NNLCbCdohajZpYsHCrkjy1adpNX",
        table_id: "tblMmtpXHTwxPPHH", // drivers_licenses
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
