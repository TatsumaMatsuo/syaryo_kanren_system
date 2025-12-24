---
name: ファイルAPIのセキュリティ強化
about: ファイル取得APIに認証チェックを追加
title: '🔒 ファイルAPIのセキュリティ強化'
labels: 'security, priority-high'
assignees: ''
---

## 📋 要件

- [ ] `requireAdmin()` ミドルウェアの追加
- [ ] ユーザー権限に基づくアクセス制限
- [ ] 不正アクセス時のエラーハンドリング
- [ ] セキュリティテストの追加
- [ ] アクセスログの記録

## 🛠️ 技術スタック

- Next.js Middleware
- NextAuth.js
- TypeScript

## 📝 説明

現在、`/api/files/:fileKey`エンドポイントには認証チェックがなく、file_keyを知っていれば誰でもアクセス可能です。セキュリティリスクを軽減するため、認証・認可チェックを追加します。

### 現在の問題

```typescript
// app/api/files/[fileKey]/route.ts
export async function GET(request: NextRequest, { params }) {
  // ❌ 認証チェックなし
  const { fileKey } = params;
  // ...ファイルを返す
}
```

### 改善後

```typescript
export async function GET(request: NextRequest, { params }) {
  // ✅ 認証チェック追加
  const authCheck = await requireAuth();
  if (!authCheck.authorized) {
    return authCheck.response; // 401 Unauthorized
  }

  // ✅ 権限チェック（管理者または申請者本人のみ）
  const { fileKey } = params;
  const file = await getFileMetadata(fileKey);

  if (!canAccessFile(authCheck.user, file)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  // ...ファイルを返す
}
```

## 📊 成功条件

- [ ] 未認証ユーザーはアクセス不可（401）
- [ ] 権限のないユーザーはアクセス不可（403）
- [ ] 管理者は全ファイルにアクセス可能
- [ ] 申請者は自分のファイルのみアクセス可能
- [ ] セキュリティテスト実装

## 🔗 関連ファイル

- `app/api/files/[fileKey]/route.ts` - ファイル取得API（要修正）
- `lib/auth-utils.ts` - 認証ユーティリティ
- `middleware.ts` - Next.js Middleware（新規作成を検討）

## 🎯 実装方針

1. `lib/auth-utils.ts`に`canAccessFile()`関数を追加
2. ファイルメタデータ（所有者情報）をLark Baseに記録
3. `/api/files/:fileKey`に認証・認可チェックを追加
4. エラーハンドリングとログ記録
5. セキュリティテストの実装

## ⚠️ セキュリティリスク

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 未認証アクセス | 高 | 認証チェック必須化 |
| file_key漏洩 | 中 | 権限チェック追加 |
| ブルートフォース | 低 | レートリミット追加 |

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
