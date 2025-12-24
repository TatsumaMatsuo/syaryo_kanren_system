# Lark OAuth 設定ガイド

車両関連管理システムでLark OAuth認証を有効にするための設定手順です。

## 1. Lark Developer Console にアクセス

1. [Lark Developer Console](https://open.feishu.cn/app) にアクセス
2. アプリ ID `cli_a9c353d3c3b81e1c` を選択

## 2. OAuth リダイレクト URI の設定

### 手順:
1. 左側メニューから **「安全設定」** または **「Security Settings」** を選択
2. **「リダイレクトURL」** または **「Redirect URLs」** セクションを見つける
3. 以下のURLを追加:
   ```
   http://localhost:3005/api/auth/callback/lark
   ```
4. **保存** をクリック

### 注意事項:
- 本番環境では、`localhost` を実際のドメインに変更してください
  - 例: `https://your-domain.com/api/auth/callback/lark`

## 3. 必要な権限（Scopes）の追加

現在、以下のエラーが発生しています:
```
Error 99991672: Access denied. One of the following scopes is required
```

### 必要な権限:
以下のいずれかの権限を有効にする必要があります:

1. `contact:contact.base:readonly` - 基本的な連絡先情報の読み取り
2. `contact:department.organize:readonly` - 部署組織情報の読み取り
3. `contact:contact:access_as_app` - アプリとして連絡先へのアクセス
4. `contact:contact:readonly` - 連絡先の読み取り
5. `contact:contact:readonly_as_app` - アプリとして連絡先の読み取り

### 設定手順:
1. 左側メニューから **「権限管理」** または **「Permissions & Scopes」** を選択
2. **「権限の追加」** または **「Add permissions」** をクリック
3. 上記の権限のいずれかを検索して追加
   - 推奨: `contact:contact.base:readonly` (最小限の権限)
4. **保存** をクリック
5. 必要に応じて、企業管理者に承認を依頼

### Lark提供のヘルプリンク:
システムが提供する以下のリンクからも権限を申請できます:
```
https://open.feishu.cn/app/cli_a9c353d3c3b81e1c/auth?q=contact:contact.base:readonly,contact:department.organize:readonly,contact:contact:access_as_app,contact:contact:readonly,contact:contact:readonly_as_app&op_from=openapi&token_type=tenant
```

## 4. 既に有効な権限

以下の権限は既に設定されています:
- Base API (多維表格) - データベース操作用
  - `bitable:app`
  - その他のBase関連権限

## 5. OAuth 認証フロー

設定完了後、以下のフローで認証が行われます:

1. ユーザーが `/auth/signin` にアクセス
2. 「Lark でログイン」ボタンをクリック
3. Lark認証ページ (`https://open.feishu.cn/open-apis/authen/v1/authorize`) にリダイレクト
4. ユーザーがLarkアカウントでログイン
5. 認証成功後、`http://localhost:3005/api/auth/callback/lark` にリダイレクト
6. NextAuthがアクセストークンを取得
7. ユーザー情報を取得してセッションを作成
8. `/dashboard` にリダイレクト

## 6. トラブルシューティング

### リダイレクトURIエラー
```
Error: redirect_uri_mismatch
```
**解決方法**: Lark Developer Consoleで設定したリダイレクトURIと `.env.local` の `LARK_OAUTH_REDIRECT_URI` が完全に一致しているか確認

### 権限エラー (99991672)
```
Error 99991672: Access denied
```
**解決方法**: 上記「3. 必要な権限の追加」を参照して権限を追加

### トークン取得エラー
```
Error: Lark auth error
```
**解決方法**:
- `LARK_OAUTH_CLIENT_ID` と `LARK_OAUTH_CLIENT_SECRET` が正しいか確認
- Lark Developer Consoleでアプリが有効化されているか確認

## 7. 環境変数の確認

`.env.local` ファイルに以下の値が正しく設定されていることを確認:

```bash
# Lark OAuth Configuration
LARK_OAUTH_CLIENT_ID=cli_a9c353d3c3b81e1c
LARK_OAUTH_CLIENT_SECRET=3poxwhPwSz179YcXtaYslgKbSMkRoQwB
LARK_OAUTH_REDIRECT_URI=http://localhost:3005/api/auth/callback/lark

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=q674NSad6om5YSw7Oq6At9nfvdfCHeCF1E5GffbUjEk=
```

## 8. 次のステップ

1. ✅ OAuth設定をLark Developer Consoleで完了
2. 開発サーバーを再起動
   ```bash
   # Ctrl+C で現在のサーバーを停止
   npm run dev
   ```
3. `http://localhost:3005/auth/signin` にアクセスしてテスト
4. ログインフローを確認

## 参考リンク

- [Lark OAuth 2.0 Guide](https://open.feishu.cn/document/ukTMukTMukTM/ukzN4UjL5cDO14SO3gTN)
- [Lark User Authentication](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/authen/access_token)
- [Error Code Reference](https://open.feishu.cn/document/uAjLw4CM/ugTN1YjL4UTN24CO1UjN/trouble-shooting/how-to-fix-the-99991672-error)
