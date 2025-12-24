# ファイルアップロード機能 実装ガイド

## 📝 実装概要

車両管理システムのファイルアップロード機能を実装しました。免許証、車検証、任意保険証の画像をLarkにアップロードできます。

## 🎯 実装内容

### 1. ファイルアップロードAPIエンドポイント

**ファイル**: `app/api/upload/route.ts`

- **エンドポイント**: `POST /api/upload`
- **機能**:
  - ファイルサイズチェック（最大10MB）
  - ファイルタイプチェック（JPEG、PNG、PDFのみ）
  - Lark IM File APIを使用してファイルアップロード
  - file_keyを返す

### 2. Lark Client関数の更新

**ファイル**: `lib/lark-client.ts`

新しい関数:
- `uploadFileToLark()`: ファイルをLarkにアップロード
- `downloadFileFromLark()`: Larkからファイルをダウンロード

### 3. 申請フォームの更新

以下のページでファイルアップロード機能を実装:

- **免許証申請**: `app/(applicant)/dashboard/license/new/page.tsx`
- **車検証申請**: `app/(applicant)/dashboard/vehicle/new/page.tsx`
- **任意保険証申請**: `app/(applicant)/dashboard/insurance/new/page.tsx`

**処理フロー**:
1. ユーザーがファイルを選択
2. `/api/upload` にファイルをアップロード
3. file_keyを取得
4. 申請データと一緒にfile_keyを保存

## 🔧 技術仕様

### Lark IM File API

```typescript
const response = await larkClient.im.file.create({
  data: {
    file_type: "jpg",    // ファイル拡張子
    file_name: "image.jpg",
    file: fileBuffer,     // Buffer形式のファイルデータ
  },
});
```

### ファイル制限

- **最大サイズ**: 10MB
- **対応形式**: JPEG、JPG、PNG、PDF
- **アップロード方法**: react-dropzone（ドラッグ&ドロップ対応）

## 📦 使用パッケージ

- `@larksuiteoapi/node-sdk`: Lark SDK
- `react-dropzone`: ファイルアップロードUI
- `react-hook-form`: フォーム管理
- `zod`: バリデーション

## 🧪 テスト方法

### 手動テスト

1. 開発サーバーを起動:
   ```bash
   npm run dev
   ```

2. ブラウザで http://localhost:3001/dashboard にアクセス

3. いずれかの申請カード（免許証、車検証、任意保険証）をクリック

4. ファイルアップロード領域にファイルをドラッグ&ドロップ、または クリックして選択

5. フォームに必要情報を入力して「申請する」をクリック

6. アップロードが成功すると、ダッシュボードにリダイレクトされます

### スクリプトテスト（オプション）

```bash
# 必要なパッケージをインストール
npm install --save-dev form-data node-fetch

# テストスクリプトを実行
node test-file-upload.js path/to/test-image.jpg
```

## ⚠️ 注意事項

### 現在の制限事項

1. **ファイルの永続性**:
   - Lark IM File APIを使用しているため、ファイルは一時的なストレージに保存されます
   - 将来的にはLark Driveへの移行を検討すべきです

2. **file_keyの保存**:
   - 現在、file_keyを`image_url`フィールドに保存しています
   - ファイルを表示する際は、file_keyを使用してLark APIから取得する必要があります

3. **認証**:
   - 現在、ユーザーIDは`EMP001`でハードコードされています
   - 認証機能の実装後、実際のユーザーIDを使用するように更新が必要です

### セキュリティ考慮事項

- ✅ ファイルサイズ制限（10MB）
- ✅ ファイルタイプ制限（画像とPDFのみ）
- ⚠️ ファイル内容のウイルススキャン（未実装）
- ⚠️ ファイル名のサニタイズ（部分的に実装）

## 🚀 次のステップ

1. **認証機能の統合**: 実際のユーザーIDを取得
2. **ファイル表示機能**: アップロードされたファイルを管理者画面で表示
3. **Lark Driveへの移行**: 永続的なストレージへの移行を検討
4. **エラーハンドリングの改善**: より詳細なエラーメッセージ
5. **プログレスバーの追加**: アップロード中の進捗表示

## 📚 参考資料

- [Lark Node.js SDK](https://github.com/larksuite/node-sdk)
- [Lark IM File API Documentation](https://open.larksuite.com/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/file/create)
- [React Dropzone Documentation](https://react-dropzone.js.org/)

---

実装日: 2024-12-24
