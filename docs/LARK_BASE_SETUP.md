# Lark Base セットアップガイド

このドキュメントでは、車両関連管理システムのLark Base環境をセットアップする手順を説明します。

## 前提条件

- Lark（Feishu）アカウント
- Larkワークスペースの管理者権限

## Step 1: Larkアプリケーションの作成

1. [Lark Open Platform](https://open.feishu.cn/) にアクセス
2. 「Create App」をクリック
3. アプリケーション名を入力: `車両関連管理システム`
4. App IDとApp Secretを控えておく

## Step 2: OAuth設定

1. アプリケーションの設定画面で「Security Settings」を開く
2. 「Redirect URLs」に以下を追加:
   ```
   http://localhost:3000/api/auth/callback/lark
   https://your-production-domain.com/api/auth/callback/lark
   ```
3. OAuth Scopeを設定:
   - `bitable:app` - Base アプリケーションへのアクセス
   - `bitable:app:readonly` - Base読み取り
   - `contact:user.base` - ユーザー基本情報
   - `contact:user.email` - ユーザーメールアドレス

## Step 3: Lark Baseの作成

1. Larkアプリ内で「Base」を開く
2. 新しいBaseを作成: `車両管理システム`
3. Base Tokenをコピーしておく

## Step 4: テーブルの作成

### 4.1 社員マスタテーブル

テーブル名: `employees`

| フィールド名 | タイプ | 必須 | 説明 |
|-------------|--------|------|------|
| employee_id | テキスト | ○ | 社員ID（主キー） |
| employee_name | テキスト | ○ | 社員名 |
| email | テキスト | ○ | メールアドレス |
| department | テキスト |  | 所属部署 |
| role | 単一選択 | ○ | 役割（applicant/admin） |
| employment_status | 単一選択 | ○ | 雇用状態（active/resigned） |
| hire_date | 日付 | ○ | 入社日 |
| resignation_date | 日付 |  | 退職日 |
| created_at | 日時 | ○ | 作成日時 |
| updated_at | 日時 | ○ | 更新日時 |

### 4.2 免許証テーブル

テーブル名: `drivers_licenses`

| フィールド名 | タイプ | 必須 | 説明 |
|-------------|--------|------|------|
| id | テキスト | ○ | ID（自動生成） |
| employee_id | テキスト | ○ | 社員ID |
| license_number | テキスト | ○ | 免許証番号 |
| license_type | テキスト | ○ | 免許種類 |
| issue_date | 日付 | ○ | 発行日 |
| expiration_date | 日付 | ○ | 有効期限 |
| image_url | 添付ファイル | ○ | 免許証画像 |
| status | 単一選択 | ○ | ステータス（temporary/approved） |
| approval_status | 単一選択 | ○ | 承認状態（pending/approved/rejected） |
| rejection_reason | テキスト |  | 却下理由 |
| created_at | 日時 | ○ | 作成日時 |
| updated_at | 日時 | ○ | 更新日時 |
| deleted_flag | チェックボックス | ○ | 削除フラグ（デフォルト: false） |
| deleted_at | 日時 |  | 削除日時 |

### 4.3 車検証テーブル

テーブル名: `vehicle_registrations`

| フィールド名 | タイプ | 必須 | 説明 |
|-------------|--------|------|------|
| id | テキスト | ○ | ID（自動生成） |
| employee_id | テキスト | ○ | 社員ID |
| vehicle_number | テキスト | ○ | 車両番号 |
| vehicle_type | テキスト | ○ | 車種 |
| manufacturer | テキスト | ○ | メーカー |
| model_name | テキスト | ○ | 車名 |
| inspection_expiration_date | 日付 | ○ | 車検有効期限 |
| owner_name | テキスト | ○ | 所有者名 |
| image_url | 添付ファイル | ○ | 車検証画像 |
| status | 単一選択 | ○ | ステータス（temporary/approved） |
| approval_status | 単一選択 | ○ | 承認状態（pending/approved/rejected） |
| rejection_reason | テキスト |  | 却下理由 |
| created_at | 日時 | ○ | 作成日時 |
| updated_at | 日時 | ○ | 更新日時 |
| deleted_flag | チェックボックス | ○ | 削除フラグ |
| deleted_at | 日時 |  | 削除日時 |

### 4.4 任意保険証テーブル

テーブル名: `insurance_policies`

| フィールド名 | タイプ | 必須 | 説明 |
|-------------|--------|------|------|
| id | テキスト | ○ | ID（自動生成） |
| employee_id | テキスト | ○ | 社員ID |
| policy_number | テキスト | ○ | 保険証券番号 |
| insurance_company | テキスト | ○ | 保険会社名 |
| policy_type | テキスト | ○ | 保険種類 |
| coverage_start_date | 日付 | ○ | 補償開始日 |
| coverage_end_date | 日付 | ○ | 補償終了日 |
| insured_amount | 数値 |  | 補償金額 |
| image_url | 添付ファイル | ○ | 保険証画像 |
| status | 単一選択 | ○ | ステータス（temporary/approved） |
| approval_status | 単一選択 | ○ | 承認状態（pending/approved/rejected） |
| rejection_reason | テキスト |  | 却下理由 |
| created_at | 日時 | ○ | 作成日時 |
| updated_at | 日時 | ○ | 更新日時 |
| deleted_flag | チェックボックス | ○ | 削除フラグ |
| deleted_at | 日時 |  | 削除日時 |

### 4.5 ユーザー権限テーブル

テーブル名: `user_permissions`

| フィールド名 | タイプ | 必須 | 説明 |
|-------------|--------|------|------|
| id | テキスト | ○ | ID（UUID） |
| lark_user_id | テキスト | ○ | LarkユーザーID（open_id） |
| user_name | テキスト | ○ | ユーザー名 |
| user_email | テキスト | ○ | メールアドレス |
| role | 単一選択 | ○ | 権限レベル（admin/viewer） |
| granted_by | テキスト | ○ | 付与者のLarkユーザーID |
| granted_at | 日時 | ○ | 権限付与日時 |
| created_at | 日時 | ○ | 作成日時 |
| updated_at | 日時 | ○ | 更新日時 |

**権限レベル:**
- `admin`: 管理者（全ての操作が可能）
- `viewer`: 閲覧者（読み取り専用）

### 4.6 通知履歴テーブル

テーブル名: `notification_history`

| フィールド名 | タイプ | 必須 | 説明 |
|-------------|--------|------|------|
| id | テキスト | ○ | ID（UUID） |
| recipient_id | テキスト | ○ | 受信者のLarkユーザーID |
| notification_type | 単一選択 | ○ | 通知種類 |
| document_type | 単一選択 |  | 書類種類（license/vehicle/insurance） |
| document_id | テキスト |  | 書類ID |
| title | テキスト | ○ | 通知タイトル |
| message | 長文テキスト | ○ | 通知本文 |
| sent_at | 日時 | ○ | 送信日時 |
| status | 単一選択 | ○ | 送信ステータス（sent/failed） |
| created_at | 日時 | ○ | 作成日時 |

**通知種類の選択肢:**
- `expiration_warning`: 有効期限1週間前警告
- `expiration_alert`: 有効期限切れアラート
- `approval`: 承認通知
- `rejection`: 却下通知

## Step 5: テーブルIDの取得

各テーブルを作成したら、テーブルIDを取得します：

1. テーブルを開く
2. URLから`table_id`をコピー
   ```
   https://xxx.feishu.cn/base/APP_TOKEN?table=TABLE_ID&view=VIEW_ID
   ```
3. 6つのテーブルすべてのIDを控える
   - drivers_licenses
   - vehicle_registrations
   - insurance_policies
   - employees
   - user_permissions
   - notification_history

## Step 6: 環境変数の設定

`.env.local` ファイルに以下を設定:

```bash
# Lark Base Configuration
LARK_APP_ID=your_app_id_here
LARK_APP_SECRET=your_app_secret_here
LARK_BASE_TOKEN=your_base_token_here

# Lark Base Table IDs
LARK_TABLE_DRIVERS_LICENSES=tblXXXXXXXXXX
LARK_TABLE_VEHICLE_REGISTRATIONS=tblYYYYYYYYYY
LARK_TABLE_INSURANCE_POLICIES=tblZZZZZZZZZZ
LARK_TABLE_EMPLOYEES=tblWWWWWWWWWW
LARK_TABLE_USER_PERMISSIONS=tblVVVVVVVVVV
LARK_TABLE_NOTIFICATION_HISTORY=tblUUUUUUUUUU

# Lark OAuth Configuration
LARK_OAUTH_CLIENT_ID=your_oauth_client_id_here
LARK_OAUTH_CLIENT_SECRET=your_oauth_client_secret_here
LARK_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback/lark

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Lark Messenger API (通知用)
LARK_BOT_WEBHOOK_URL=your_webhook_url_here

# Lark Drive API (ファイルストレージ)
LARK_DRIVE_FOLDER_ID=your_folder_id_here

# Node Environment
NODE_ENV=development
```

## Step 7: 接続テスト

アプリケーションを起動して接続をテスト:

```bash
npm run dev
```

ブラウザで以下にアクセス:

```
http://localhost:3000/api/applications/overview
```

成功すると、空の配列が返ります:
```json
{
  "success": true,
  "data": [],
  "count": 0
}
```

## トラブルシューティング

### 認証エラー

```
Error: Invalid app_id or app_secret
```

**解決方法**: `LARK_APP_ID` と `LARK_APP_SECRET` が正しいか確認

### テーブルが見つからない

```
Error: Table not found
```

**解決方法**: テーブルIDが正しいか、Base Tokenが正しいか確認

### 権限エラー

```
Error: Permission denied
```

**解決方法**: アプリケーションに必要なOAuth Scopeが付与されているか確認

## 参考リンク

- [Lark Open Platform Documentation](https://open.feishu.cn/document/)
- [Lark Base API Reference](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app)
- [Lark OAuth Guide](https://open.feishu.cn/document/server-docs/authentication-management/access-token)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
