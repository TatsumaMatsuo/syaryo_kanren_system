# 車両関連管理システム

マイカー通勤申請・車両情報管理システム

## 概要

社員のマイカー通勤申請、車両情報（免許証・車検証・任意保険証）の管理、有効期限の自動通知を行うWebアプリケーションです。

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS + Shadcn/ui
- **データベース**: Lark Base
- **認証**: NextAuth.js + Lark OAuth
- **通知**: Lark Messenger API
- **ファイルストレージ**: Lark Drive

## 主な機能

- 免許証・車検証・任意保険証の申請管理
- 管理者による承認・却下処理
- 有効期限の自動通知（1週間前・期限切れ時）
- 許可証の発行・管理
- 退職時の論理削除機能

## セットアップ

### 前提条件

- Node.js 20以上
- npm または yarn
- Larkアカウント（Lark Base, Lark OAuth を使用）

### インストール手順

#### 1. リポジトリをクローン

```bash
git clone https://github.com/TatsumaMatsuo/syaryo_kanren_system.git
cd syaryo_kanren_system
```

#### 2. 依存関係をインストール

```bash
npm install
```

#### 3. Lark Baseのセットアップ

Lark Baseのテーブルとアプリケーションを設定します。

詳細は [docs/LARK_BASE_SETUP.md](./docs/LARK_BASE_SETUP.md) を参照してください。

**必要なテーブル（6つ）:**
- drivers_licenses（免許証）
- vehicle_registrations（車検証）
- insurance_policies（任意保険）
- employees（社員マスタ）
- user_permissions（ユーザー権限）
- notification_history（通知履歴）

#### 4. 環境変数を設定

**方法A: 対話型スクリプトを使用（推奨）**

```bash
npm run setup-env
```

このスクリプトが対話的に環境変数を設定し、`.env.local` ファイルを生成します。

**方法B: 手動で設定**

```bash
cp .env.example .env.local
```

`.env.local` を編集して以下の値を設定:
- `LARK_APP_ID`: Lark アプリケーションID
- `LARK_APP_SECRET`: Lark アプリケーションシークレット
- `LARK_BASE_TOKEN`: Lark Base トークン
- `LARK_TABLE_*`: 各テーブルのID（6つ）
- `NEXTAUTH_SECRET`: NextAuth用のシークレットキー（`openssl rand -base64 32` で生成）

#### 5. 開発サーバーを起動

```bash
npm run dev
```

サーバーが起動したら、ブラウザで [http://localhost:3001](http://localhost:3001) を開いてください。

#### 6. 接続テスト

開発サーバーが起動している状態で、別のターミナルで以下を実行:

```bash
npm run test:connection
```

または、ブラウザで [http://localhost:3001/api/test/lark-connection](http://localhost:3001/api/test/lark-connection) にアクセスします。

成功すると、以下のようなレスポンスが返ります:

```json
{
  "success": true,
  "message": "すべての接続テストに成功しました",
  "tables": [
    { "table": "drivers_licenses", "status": "success", "recordCount": 0 },
    { "table": "vehicle_registrations", "status": "success", "recordCount": 0 },
    { "table": "insurance_policies", "status": "success", "recordCount": 0 },
    { "table": "employees", "status": "success", "recordCount": 0 }
  ]
}
```

## スクリプト

```bash
npm run dev              # 開発サーバーを起動
npm run build            # 本番用ビルド
npm run start            # 本番サーバーを起動
npm run lint             # ESLintでコードチェック
npm run format           # Prettierでコード整形
npm run setup-env        # 環境変数の対話型設定
npm run test:connection  # Lark Base接続テスト
```

## プロジェクト構造

```
syaryo_kanren_system/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ
│   ├── (applicant)/       # 申請者用ページ
│   ├── (admin)/           # 管理者用ページ
│   ├── api/               # APIルート
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ
├── components/            # Reactコンポーネント
│   ├── ui/               # UIコンポーネント（Shadcn/ui）
│   ├── forms/            # フォームコンポーネント
│   ├── layouts/          # レイアウトコンポーネント
│   └── features/         # 機能別コンポーネント
├── lib/                  # ユーティリティ関数
├── services/             # ビジネスロジック
├── types/                # TypeScript型定義
├── public/               # 静的ファイル
└── docs/                 # ドキュメント
    ├── REQUIREMENTS.md      # 要件定義
    ├── DATABASE_SCHEMA.md   # DB設計
    ├── ARCHITECTURE.md      # アーキテクチャ
    └── ISSUES.md           # 開発Issue一覧
```

## 開発フェーズ

開発は以下の10フェーズに分かれています：

1. **Phase 1**: プロジェクト初期セットアップ ✅
2. **Phase 2**: Lark Base連携の実装 ✅
3. **Phase 3**: 認証・ログイン機能の実装 ✅
4. **Phase 4**: 申請フォームの実装 ✅
5. **Phase 5**: 管理者承認画面の実装 ✅
6. **Phase 6**: 有効期限管理・通知機能の実装 ✅
7. **Phase 7**: 退職時の論理削除機能 ✅
8. **Phase 8**: 許可証発行機能の実装 🚧
9. **Phase 9**: テスト実装 ⬜
10. **Phase 10**: デプロイ・インフラ設定 ⬜

✅ 完了 | 🚧 進行中 | ⬜ 未着手

詳細は [ISSUES.md](./ISSUES.md) を参照してください。

## 最新の更新

### 2024-12-24: ファイルアップロード機能の実装

免許証、車検証、任意保険証の画像アップロード機能を実装しました。

**主な機能**:
- Lark IM File APIを使用したファイルアップロード
- ドラッグ&ドロップ対応
- ファイルサイズ・タイプのバリデーション（最大10MB、JPEG/PNG/PDF）
- 3つの申請フォーム（免許証、車検証、任意保険証）すべてに対応

詳細は [FILE_UPLOAD_IMPLEMENTATION.md](./FILE_UPLOAD_IMPLEMENTATION.md) を参照してください。

## ドキュメント

- [要件定義書](./REQUIREMENTS.md)
- [データベース設計書](./DATABASE_SCHEMA.md)
- [アーキテクチャ設計書](./ARCHITECTURE.md)
- [開発Issue一覧](./ISSUES.md)
- [Lark Baseセットアップガイド](./docs/LARK_BASE_SETUP.md) 🆕

## ライセンス

MIT License

## コントリビューション

プルリクエストを歓迎します。大きな変更を加える場合は、まずIssueを開いて変更内容を議論してください。

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
