---
name: Content-Type動的設定
about: ファイルの種類に応じて正しいContent-Typeを設定
title: '📄 Content-Type動的設定の実装'
labels: 'enhancement, priority-medium'
assignees: ''
---

## 📋 要件

- [ ] Lark Baseに`file_type`フィールドを追加
- [ ] アップロード時にMIMEタイプを保存
- [ ] ダウンロード時に正しいContent-Typeを設定
- [ ] JPEG, PNG, PDF対応
- [ ] 未知のファイルタイプのハンドリング

## 🛠️ 技術スタック

- Lark Base API
- TypeScript
- Next.js
- mime-types（NPMパッケージ）

## 📝 説明

現在、すべてのファイルに`image/jpeg`のContent-Typeを設定していますが、実際のファイル形式に応じて正しいMIMEタイプを設定する必要があります。

### 現在の問題

```typescript
// app/api/files/[fileKey]/route.ts
return new NextResponse(fileBuffer, {
  headers: {
    "Content-Type": "image/jpeg", // ❌ 固定値
    "Cache-Control": "public, max-age=31536000, immutable",
  },
});
```

### 改善後

```typescript
// ファイルタイプを動的に取得
const fileMetadata = await getFileMetadata(fileKey);
const contentType = mimeTypes[fileMetadata.file_type] || "application/octet-stream";

return new NextResponse(fileBuffer, {
  headers: {
    "Content-Type": contentType, // ✅ 動的に設定
    "Cache-Control": "public, max-age=31536000, immutable",
  },
});
```

## 📊 サポートするMIMEタイプ

| 拡張子 | MIMEタイプ | 説明 |
|--------|-----------|------|
| .jpg, .jpeg | image/jpeg | JPEG画像 |
| .png | image/png | PNG画像 |
| .pdf | application/pdf | PDF文書 |
| .gif | image/gif | GIF画像 |
| .webp | image/webp | WebP画像 |
| その他 | application/octet-stream | バイナリファイル |

## 📊 Lark Baseスキーマ更新

### drivers_licenses テーブル

```
新規フィールド:
- file_type: single_select (jpeg, png, pdf)
- file_mime_type: text
```

### vehicles テーブル

```
新規フィールド:
- file_type: single_select (jpeg, png, pdf)
- file_mime_type: text
```

### insurances テーブル

```
新規フィールド:
- file_type: single_select (jpeg, png, pdf)
- file_mime_type: text
```

## 📊 成功条件

- [ ] アップロード時にファイルタイプを正しく検出
- [ ] ダウンロード時に正しいContent-Typeを返す
- [ ] ブラウザで正しく表示される
- [ ] PDFファイルが正常に表示される

## 🔗 関連ファイル

- `app/api/upload/route.ts` - ファイルアップロードAPI
- `app/api/files/[fileKey]/route.ts` - ファイル取得API
- `lib/lark-client.ts` - Lark API クライアント
- `app/(applicant)/dashboard/*/new/page.tsx` - 申請フォーム

## 🎯 実装方針

1. `mime-types`パッケージのインストール
2. Lark Baseスキーマにフィールドを追加
3. アップロードAPI: ファイルタイプを検出して保存
4. ダウンロードAPI: メタデータからContent-Typeを取得
5. 既存データのマイグレーション（デフォルト: image/jpeg）

## 💡 実装例

```typescript
import mime from "mime-types";

// アップロード時
const mimeType = mime.lookup(file.name) || "application/octet-stream";
const fileExtension = mime.extension(mimeType);

await larkClient.bitable.appTableRecord.create({
  // ...
  fields: {
    file_type: fileExtension,
    file_mime_type: mimeType,
  },
});

// ダウンロード時
const record = await getFileRecord(fileKey);
const contentType = record.file_mime_type || "application/octet-stream";
```

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
