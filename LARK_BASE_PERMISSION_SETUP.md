# Lark Base ユーザー権限テーブル作成ガイド

車両関連管理システムで権限管理機能を使用するために、Lark Baseにユーザー権限テーブルを作成する手順です。

## 前提条件

- Lark Baseへのアクセス権限があること
- Base Token: `NNLCbCdohajZpYsHCrkjy1adpNX`

## ステップ1: Lark Baseにアクセス

1. ブラウザで以下のURLにアクセス:
   ```
   https://base.feishu.cn/base/NNLCbCdohajZpYsHCrkjy1adpNX
   ```
   または
   ```
   https://base.larksuite.com/base/NNLCbCdohajZpYsHCrkjy1adpNX
   ```

2. 既存の以下のテーブルが表示されることを確認:
   - 免許証 (drivers_licenses)
   - 車検証 (vehicle_registrations)
   - 任意保険証 (insurance_policies)
   - 社員マスタ (employees)

## ステップ2: ユーザー権限テーブルの作成

### 2-1. 新しいテーブルを追加

1. 左下の **「+ テーブルを追加」** または **「+ Add Table」** をクリック
2. テーブル名を入力:
   - 日本語: `ユーザー権限`
   - 英語: `user_permissions`

### 2-2. フィールドの作成

以下のフィールドを順番に作成してください：

#### 1. id (テキスト)
- **フィールド名**: `id`
- **フィールドタイプ**: テキスト
- **説明**: レコードID（自動生成）

#### 2. lark_user_id (テキスト) ★重要
- **フィールド名**: `lark_user_id`
- **フィールドタイプ**: テキスト
- **説明**: LarkユーザーのOpen ID
- **必須**: はい

#### 3. user_name (テキスト)
- **フィールド名**: `user_name`
- **フィールドタイプ**: テキスト
- **説明**: ユーザー名

#### 4. user_email (テキスト)
- **フィールド名**: `user_email`
- **フィールドタイプ**: テキスト
- **説明**: メールアドレス

#### 5. role (単一選択) ★重要
- **フィールド名**: `role`
- **フィールドタイプ**: 単一選択 (Single Select)
- **選択肢**:
  - `admin` (管理者)
  - `editor` (編集者)
  - `viewer` (閲覧者)

**選択肢の追加方法**:
1. フィールド設定で「単一選択」を選択
2. 「選択肢を追加」をクリック
3. 上記の3つの値を順番に追加

#### 6. granted_by (テキスト)
- **フィールド名**: `granted_by`
- **フィールドタイプ**: テキスト
- **説明**: 権限を付与したユーザーID

#### 7. granted_at (数値)
- **フィールド名**: `granted_at`
- **フィールドタイプ**: 数値 (Number)
- **説明**: 権限付与日時（Unixタイムスタンプ）

#### 8. created_at (数値)
- **フィールド名**: `created_at`
- **フィールドタイプ**: 数値 (Number)
- **説明**: 作成日時（Unixタイムスタンプ）

#### 9. updated_at (数値)
- **フィールド名**: `updated_at`
- **フィールドタイプ**: 数値 (Number)
- **説明**: 更新日時（Unixタイムスタンプ）

### フィールド一覧（確認用）

| フィールド名 | タイプ | 必須 | 説明 |
|------------|--------|------|------|
| id | テキスト | - | レコードID |
| lark_user_id | テキスト | ✓ | LarkユーザーOpen ID |
| user_name | テキスト | - | ユーザー名 |
| user_email | テキスト | - | メールアドレス |
| role | 単一選択 | ✓ | 権限ロール (admin/editor/viewer) |
| granted_by | テキスト | - | 権限付与者 |
| granted_at | 数値 | - | 権限付与日時 |
| created_at | 数値 | - | 作成日時 |
| updated_at | 数値 | - | 更新日時 |

## ステップ3: テーブルIDの取得

テーブル作成後、テーブルIDを取得します。

### 方法1: URLから取得

1. 作成した「ユーザー権限」テーブルを開く
2. ブラウザのアドレスバーを確認
3. URLの形式: `https://base.feishu.cn/base/NNLCbCdohajZpYsHCrkjy1adpNX?table=tblXXXXXXXX`
4. `tbl` で始まる部分がテーブルID
   - 例: `tblAbc123XYZ456`

### 方法2: テーブル設定から取得

1. テーブル右上の「⋮」メニューをクリック
2. 「テーブル設定」を選択
3. テーブルIDが表示される

## ステップ4: 環境変数の設定

取得したテーブルIDを`.env.local`に設定します。

1. プロジェクトルートの `.env.local` ファイルを開く
2. 以下の行を見つける:
   ```bash
   LARK_TABLE_USER_PERMISSIONS=
   ```
3. 取得したテーブルIDを設定:
   ```bash
   LARK_TABLE_USER_PERMISSIONS=tblXXXXXXXX
   ```
   （`tblXXXXXXXX` を実際のテーブルIDに置き換える）

4. ファイルを保存

## ステップ5: 開発サーバーの再起動

環境変数を反映させるため、開発サーバーを再起動します。

```bash
# Ctrl+C でサーバーを停止してから
npm run dev
```

## ステップ6: 最初の管理者ユーザーの追加

権限管理機能を使うには、最初の管理者ユーザーを手動で追加する必要があります。

### ログインしているユーザーのIDを取得

1. http://localhost:3005 にアクセスしてログイン
2. ブラウザの開発者ツールを開く（F12）
3. コンソールで以下を実行:
   ```javascript
   fetch('/api/auth/session')
     .then(r => r.json())
     .then(data => console.log(data))
   ```
4. 表示された情報から以下を確認:
   - `user.id` - ユーザーID
   - `user.name` - ユーザー名
   - `user.email` - メールアドレス

### Lark Baseに管理者レコードを追加

1. Lark Baseの「ユーザー権限」テーブルを開く
2. 「+ レコードを追加」をクリック
3. 以下の情報を入力:

   | フィールド | 値 | 例 |
   |-----------|-----|-----|
   | id | （空欄でOK） | - |
   | lark_user_id | 上記で取得したuser.id | `ou_xxx123` |
   | user_name | 上記で取得したuser.name | `山口 太郎` |
   | user_email | 上記で取得したuser.email | `tatsuma.m@yamaguchi-kk.co.jp` |
   | role | `admin` を選択 | admin |
   | granted_by | `system` | system |
   | granted_at | 現在時刻のUnixタイムスタンプ | `1703314800000` |
   | created_at | 現在時刻のUnixタイムスタンプ | `1703314800000` |
   | updated_at | 現在時刻のUnixタイムスタンプ | `1703314800000` |

**Unixタイムスタンプの取得方法**:
- ブラウザのコンソールで `Date.now()` を実行
- または https://www.unixtimestamp.com/ を使用

4. レコードを保存

## ステップ7: 動作確認

1. http://localhost:3005/admin/settings/permissions にアクセス
2. ログイン中のユーザーが管理者として表示されることを確認
3. 「管理者を追加」ボタンが使用可能になることを確認

## トラブルシューティング

### エラー: 404 page not found

**原因**: テーブルIDが正しく設定されていない

**解決方法**:
1. `.env.local` の `LARK_TABLE_USER_PERMISSIONS` の値を再確認
2. 開発サーバーを再起動

### エラー: 403 Forbidden

**原因**: 管理者レコードが作成されていない

**解決方法**:
1. ステップ6に従って、Lark Baseに管理者レコードを手動で追加
2. `lark_user_id` が正しいか確認（ブラウザのコンソールでセッション情報を確認）

### 管理者追加ボタンが表示されない

**原因**: ログイン中のユーザーが管理者として登録されていない

**解決方法**:
1. Lark Baseの「ユーザー権限」テーブルを確認
2. ログイン中のユーザーのレコードが存在するか確認
3. `role` が `admin` になっているか確認

## 参考: 権限レベルについて

| ロール | 権限内容 |
|--------|---------|
| admin | すべての機能にアクセス可能。ユーザー権限の管理、申請の承認・却下が可能 |
| editor | データの閲覧と編集が可能。承認機能は使用不可 |
| viewer | データの閲覧のみ可能 |

## 次のステップ

権限テーブルの作成が完了したら、以下の機能が使用可能になります：

1. 管理者・編集者・閲覧者の追加
2. ユーザー権限の管理
3. 申請の承認・却下機能
4. 期限監視機能

---

質問や問題が発生した場合は、開発サーバーのログを確認するか、サポートにお問い合わせください。
