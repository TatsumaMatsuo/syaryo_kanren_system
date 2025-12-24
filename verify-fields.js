// フィールド設定を検証するスクリプト
const lark = require("@larksuiteoapi/node-sdk");

const client = new lark.Client({
  appId: "cli_a9c353d3c3b81e1c",
  appSecret: "3poxwhPwSz179YcXtaYslgKbSMkRoQwB",
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Feishu,
});

const REQUIRED_FIELDS = [
  { name: "employee_id", type: 1 },
  { name: "license_number", type: 1 },
  { name: "license_type", type: 3 },
  { name: "expiration_date", type: 5 },
  { name: "image_url", type: 1 },
  { name: "status", type: 3 },
  { name: "approval_status", type: 3 },
];

async function verifyFields() {
  try {
    console.log("=== フィールド設定検証 ===\n");

    const response = await client.bitable.appTableField.list({
      path: {
        app_token: "NNLCbCdohajZpYsHCrkjy1adpNX",
        table_id: "tblMmtpXHTwxPPHH",
      },
    });

    const existingFields = response.data?.items || [];
    console.log(`現在のフィールド数: ${existingFields.length}\n`);

    // 各必須フィールドをチェック
    let allOk = true;
    REQUIRED_FIELDS.forEach((required) => {
      const found = existingFields.find(
        (f) => f.field_name === required.name && f.type === required.type
      );

      if (found) {
        console.log(`✅ ${required.name} - OK`);
      } else {
        console.log(`❌ ${required.name} - 見つかりません`);
        allOk = false;
      }
    });

    console.log("\n" + "=".repeat(50));

    if (allOk) {
      console.log("✅ すべてのフィールドが正しく設定されています！");
      console.log("\n次のステップ:");
      console.log("1. レコード作成テスト: node test-create-record.js");
      console.log("2. ブラウザでテスト: http://localhost:3002/dashboard/license/new");
    } else {
      console.log("❌ 一部のフィールドが不足しています");
      console.log("\nLark Baseで以下のフィールドを追加してください:");
      REQUIRED_FIELDS.forEach((required) => {
        const found = existingFields.find(
          (f) => f.field_name === required.name
        );
        if (!found) {
          const typeNames = {
            1: "テキスト",
            3: "単一選択",
            5: "日付",
          };
          console.log(`  - ${required.name} (${typeNames[required.type]})`);
        }
      });
    }

    console.log("\n現在のフィールド一覧:");
    existingFields.forEach((field, i) => {
      console.log(`${i + 1}. ${field.field_name} (タイプ: ${field.type})`);
    });
  } catch (error) {
    console.error("❌ エラー:", error.message);
  }
}

verifyFields();
