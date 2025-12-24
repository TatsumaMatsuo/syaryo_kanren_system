# クイックスタートガイド

車両関連管理システムを最短で動かすためのガイドです。

## 🚀 5分で始める

### ステップ1: 環境を準備

```bash
# リポジトリをクローン（既にクローン済みの場合はスキップ）
git clone https://github.com/TatsumaMatsuo/syaryo_kanren_system.git
cd syaryo_kanren_system

# 依存関係をインストール
npm install
```

### ステップ2: Lark Baseを準備

#### 2-1. Larkアカウントにログイン

1. https://www.larksuite.com/ にアクセス
2. アカウントにログイン

#### 2-2. Larkアプリを作成

1. https://open.larksuite.com/ にアクセス
2. 「Create App」をクリック
3. アプリ名: **車両関連管理システム**
4. 以下の情報を控える:
   - **App ID**: `cli_xxxxxxxxxx`
   - **App Secret**: `xxxxxxxxxxxxxxxxxxxxxx`

#### 2-3. Lark Baseを作成

1. Larkアプリで「Base」を開く
2. 新しいBaseを作成: **車両管理システム**
3. **Base Token** を控える（URL内の `basc...` の部分）

#### 2-4. テーブルを作成

以下の4つのテーブルを作成します（詳細は [docs/LARK_BASE_SETUP.md](./docs/LARK_BASE_SETUP.md) を参照）:

1. **drivers_licenses** （免許証）
2. **vehicle_registrations** （車検証）
3. **insurance_policies** （任意保険）
4. **employees** （社員マスタ）

各テーブルのIDを控えてください。

### ステップ3: 環境変数を設定

対話型スクリプトを使用して環境変数を設定します:

```bash
npm run setup-env
```

以下の情報を順番に入力:
1. Lark App ID
2. Lark App Secret
3. Lark Base Token
4. 各テーブルのID（4つ）
5. その他の設定（Enter でスキップ可能）

または、手動で `.env.local` を編集してください。

### ステップ4: 開発サーバーを起動

```bash
npm run dev
```

サーバーが起動すると、以下のように表示されます:

```
   ▲ Next.js 15.x.x
   - Local:        http://localhost:3001
   - Network:      http://192.168.x.x:3001

 ✓ Ready in 5s
```

### ステップ5: 接続をテスト

ブラウザで以下にアクセス:

```
http://localhost:3001/api/test/lark-connection
```

成功すると、以下のようなレスポンスが表示されます:

```json
{
  "success": true,
  "message": "すべての接続テストに成功しました",
  "tables": [
    { "table": "drivers_licenses", "status": "success" },
    { "table": "vehicle_registrations", "status": "success" },
    { "table": "insurance_policies", "status": "success" },
    { "table": "employees", "status": "success" }
  ]
}
```

## ✅ 成功！

接続テストが成功したら、以下のページにアクセスしてみましょう:

- **ホームページ**: http://localhost:3001
- **ダッシュボード**: http://localhost:3001/dashboard
- **管理者画面**: http://localhost:3001/admin/applications

## 🔧 トラブルシューティング

### エラー: "環境変数が設定されていません"

**原因**: `.env.local` ファイルが見つからないか、必要な環境変数が不足しています。

**解決方法**:
1. `npm run setup-env` を実行して環境変数を設定
2. または `.env.example` をコピーして `.env.local` を作成

### エラー: "Larkクライアントの初期化に失敗"

**原因**: `LARK_APP_ID` または `LARK_APP_SECRET` が無効です。

**解決方法**:
1. Lark Developer Consoleで正しいApp IDとApp Secretを確認
2. `.env.local` の値を修正

### エラー: "Table not found"

**原因**: テーブルIDが間違っているか、テーブルが作成されていません。

**解決方法**:
1. Lark Baseでテーブルが作成されているか確認
2. テーブルのURLから正しいIDをコピー
3. `.env.local` の `LARK_TABLE_*` 値を修正

### エラー: "Permission denied"

**原因**: Larkアプリに必要な権限が付与されていません。

**解決方法**:
1. Lark Developer Consoleでアプリの設定を開く
2. 「Permissions & Scopes」タブで以下を追加:
   - `bitable:app`
   - `bitable:app:readonly`
   - `bitable:record:write`
   - `bitable:record:read`

## 📚 次のステップ

接続テストが成功したら、以下のドキュメントを参照してください:

1. [要件定義書](./REQUIREMENTS.md) - システムの詳細仕様
2. [アーキテクチャ設計書](./ARCHITECTURE.md) - システム構成
3. [データベース設計書](./DATABASE_SCHEMA.md) - テーブル構造
4. [Lark Baseセットアップガイド](./docs/LARK_BASE_SETUP.md) - 詳細なセットアップ手順

## 💡 ヒント

### テストデータの追加

開発を進めるために、テストデータを追加できます:

1. Lark Baseの各テーブルを開く
2. 手動でレコードを追加
3. アプリで表示されることを確認

### ホットリロード

Next.jsは自動的にファイルの変更を検出し、ブラウザをリロードします。
コードを編集すると、即座に反映されます。

### デバッグ

開発サーバーのログは、ターミナルに表示されます。
エラーが発生した場合は、ログを確認してください。

## 🆘 サポート

問題が解決しない場合は、以下をお試しください:

1. [GitHub Issues](https://github.com/TatsumaMatsuo/syaryo_kanren_system/issues) で既存の問題を検索
2. 新しいIssueを作成して質問

---

Happy Coding! 🎉
