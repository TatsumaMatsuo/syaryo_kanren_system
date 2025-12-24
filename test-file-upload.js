/**
 * ファイルアップロード機能のテストスクリプト
 *
 * 使用方法:
 * 1. 開発サーバーを起動 (npm run dev)
 * 2. テスト用の画像ファイルを用意
 * 3. node test-file-upload.js <画像ファイルパス>
 */

const fs = require('fs');
const path = require('path');

async function testFileUpload(filePath) {
  try {
    if (!filePath) {
      console.error('使用方法: node test-file-upload.js <画像ファイルパス>');
      process.exit(1);
    }

    if (!fs.existsSync(filePath)) {
      console.error(`ファイルが見つかりません: ${filePath}`);
      process.exit(1);
    }

    console.log('📤 ファイルアップロードテストを開始します...');
    console.log(`ファイル: ${filePath}`);

    // FormDataを作成
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    // アップロードAPIを呼び出す
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ ファイルアップロード成功!');
      console.log('結果:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ ファイルアップロード失敗');
      console.log('エラー:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// コマンドライン引数からファイルパスを取得
const filePath = process.argv[2];
testFileUpload(filePath);
