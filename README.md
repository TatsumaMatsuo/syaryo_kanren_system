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

### インストール手順

1. **リポジトリをクローン**

```bash
git clone https://github.com/TatsumaMatsuo/syaryo_kanren_system.git
cd syaryo_kanren_system
```

2. **依存関係をインストール**

```bash
npm install
```

3. **環境変数を設定**

`.env.local` ファイルを編集し、必要な環境変数を設定します：

```bash
cp .env.example .env.local
```

以下の環境変数を設定してください：

- `LARK_APP_ID`: Lark アプリケーションID
- `LARK_APP_SECRET`: Lark アプリケーションシークレット
- `LARK_BASE_TOKEN`: Lark Base トークン
- `NEXTAUTH_SECRET`: NextAuth用のシークレットキー（`openssl rand -base64 32` で生成）

4. **開発サーバーを起動**

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## スクリプト

```bash
npm run dev      # 開発サーバーを起動
npm run build    # 本番用ビルド
npm run start    # 本番サーバーを起動
npm run lint     # ESLintでコードチェック
npm run format   # Prettierでコード整形
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
2. **Phase 2**: Lark Base連携の実装
3. **Phase 3**: 認証・ログイン機能の実装
4. **Phase 4**: 申請フォームの実装
5. **Phase 5**: 管理者承認画面の実装
6. **Phase 6**: 有効期限管理・通知機能の実装
7. **Phase 7**: 退職時の論理削除機能
8. **Phase 8**: 許可証発行機能の実装
9. **Phase 9**: テスト実装
10. **Phase 10**: デプロイ・インフラ設定

詳細は [ISSUES.md](./ISSUES.md) を参照してください。

## ドキュメント

- [要件定義書](./REQUIREMENTS.md)
- [データベース設計書](./DATABASE_SCHEMA.md)
- [アーキテクチャ設計書](./ARCHITECTURE.md)
- [開発Issue一覧](./ISSUES.md)

## ライセンス

MIT License

## コントリビューション

プルリクエストを歓迎します。大きな変更を加える場合は、まずIssueを開いて変更内容を議論してください。

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
