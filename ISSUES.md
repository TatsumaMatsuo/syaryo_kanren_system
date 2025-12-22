# 開発Issue一覧

このドキュメントは、車両関連管理システムの開発で必要なIssuesをフェーズ別にまとめたものです。

## Phase 1: プロジェクト初期セットアップ

**タイトル**: 【Phase 1】プロジェクト初期セットアップ

**ラベル**: `type:feature`, `priority:P0-Critical`, `phase:planning`, `agent:coordinator`

**内容**:
- Next.js 14+ (App Router) プロジェクトの初期化
- TypeScript設定
- Tailwind CSS + Shadcn/ui のセットアップ
- ESLint + Prettier の設定
- ディレクトリ構造の作成
- 環境変数設定ファイル
- README.md更新

**成功基準**:
- `npm run dev` でローカル開発サーバーが起動
- TypeScriptのコンパイルエラーなし
- Tailwind CSSが正しく動作

---

## Phase 2: Lark Base連携の実装

**タイトル**: 【Phase 2】Lark Base連携の実装

**ラベル**: `type:feature`, `priority:P0-Critical`, `phase:development`, `agent:codegen`

**内容**:
- Lark Base SDK のインストールと設定
- Lark OAuth認証の実装
- データベーステーブルの作成（免許証、車検証、任意保険、社員マスタ）
- CRUD操作の実装
- 統合ビューの作成（3テーブル結合）

**成功基準**:
- Lark Baseへの接続成功
- 全テーブルのCRUD操作が正常動作
- 統合ビューでデータが正しく表示

---

## Phase 3: 認証・ログイン機能の実装

**タイトル**: 【Phase 3】認証・ログイン機能の実装

**ラベル**: `type:feature`, `priority:P0-Critical`, `phase:development`, `agent:codegen`, `special:security`

**内容**:
- NextAuth.js のセットアップ
- Lark OAuthプロバイダーの設定
- ログイン画面の実装
- セッション管理
- ロールベースアクセス制御（申請者/管理者）
- 認証ミドルウェアの実装

**成功基準**:
- Larkアカウントでログイン可能
- セッションが正しく管理される
- 役割に応じたアクセス制御が機能

---

## Phase 4: 申請フォームの実装

**タイトル**: 【Phase 4】申請フォームの実装（免許証・車検証・任意保険）

**ラベル**: `type:feature`, `priority:P1-High`, `phase:development`, `agent:codegen`

**内容**:
- ファイルアップロードコンポーネントの実装（react-dropzone）
- 免許証申請フォームの実装
- 車検証申請フォームの実装
- 任意保険申請フォームの実装
- フォームバリデーション（React Hook Form + Zod）
- ファイルアップロードAPI（Lark Drive連携）
- プレビュー機能
- 申請データの保存（Lark Base）

**成功基準**:
- 画像ファイルのアップロードが正常動作
- フォームバリデーションが正しく機能
- 申請データがLark Baseに保存される
- モバイルでも使いやすいUI

---

## Phase 5: 管理者承認画面の実装

**タイトル**: 【Phase 5】管理者承認画面の実装

**ラベル**: `type:feature`, `priority:P1-High`, `phase:development`, `agent:codegen`

**内容**:
- 申請一覧画面（統合ビュー）の実装
- 申請詳細画面の実装
- 承認ボタンの実装
- 却下ボタン + 理由入力フォームの実装
- ステータス更新処理（仮→本）
- チャット通知の送信
- フィルター・検索機能

**成功基準**:
- 統合ビューで3つのテーブルのデータが表示
- 承認処理が正常動作
- 却下時に理由が記録される
- 申請者に通知が送信される

---

## Phase 6: 有効期限管理・通知機能の実装

**タイトル**: 【Phase 6】有効期限管理・通知機能の実装

**ラベル**: `type:feature`, `priority:P1-High`, `phase:development`, `agent:codegen`

**内容**:
- 日次バッチ処理の実装（Node-cron）
- 有効期限チェック処理
- 1週間前アラート送信機能
- 期限切れアラート送信機能
- 通知テンプレートの作成
- 通知履歴の記録
- 削除フラグのデータを除外するロジック

**成功基準**:
- 日次バッチが正常に実行
- 期限1週間前に申請者に通知
- 期限切れ時に申請者と管理者に通知
- 削除フラグのデータは通知対象外

---

## Phase 7: 退職時の論理削除機能

**タイトル**: 【Phase 7】退職時の論理削除機能

**ラベル**: `type:feature`, `priority:P2-Medium`, `phase:development`, `agent:codegen`

**内容**:
- 削除フラグ設定API の実装
- 削除フラグによるフィルタリング処理
- 社員マスタの雇用状態管理
- 一覧表示での削除データ除外
- 通知対象からの除外処理
- 管理画面での削除データ表示機能（オプション）

**成功基準**:
- 削除フラグが正しく設定される
- 削除されたデータが一覧に表示されない
- 削除されたデータに通知が送信されない
- データは物理削除されず履歴が保持される

---

## Phase 8: 許可証発行機能の実装

**タイトル**: 【Phase 8】許可証発行機能の実装

**ラベル**: `type:feature`, `priority:P2-Medium`, `phase:development`, `agent:codegen`

**内容**:
- 許可証テンプレートのデザイン
- 許可証生成処理（PDF）
- 許可証表示画面
- 許可証ダウンロード機能
- QRコード生成（検証用）
- 許可証の有効期限表示

**成功基準**:
- 承認後に許可証が生成される
- 許可証をPDFでダウンロードできる
- QRコードで許可証を検証できる
- モバイルでも表示できる

---

## Phase 9: テスト実装

**タイトル**: 【Phase 9】テスト実装

**ラベル**: `type:test`, `priority:P1-High`, `phase:development`, `agent:codegen`

**内容**:
- Jestのセットアップ
- React Testing Libraryのセットアップ
- ユニットテストの実装（コンポーネント、API）
- 統合テストの実装（申請フロー、承認フロー）
- E2Eテストの実装（Playwright / Cypress）
- テストカバレッジ80%以上達成
- CI/CDパイプラインへの組み込み

**成功基準**:
- テストカバレッジ ≥ 80%
- 全テストがパスする
- CI/CDでテストが自動実行される

---

## Phase 10: デプロイ・インフラ設定

**タイトル**: 【Phase 10】デプロイ・インフラ設定

**ラベル**: `type:feature`, `priority:P2-Medium`, `phase:deployment`, `agent:deploy`

**内容**:
- Vercelプロジェクトのセットアップ
- 環境変数の設定（Production）
- GitHub Actionsの設定
- Sentryのセットアップ（エラー監視）
- パフォーマンスモニタリング設定
- ログ収集の設定
- バックアップ戦略の実装

**成功基準**:
- 本番環境にデプロイできる
- CI/CDパイプラインが正常に動作
- エラー監視が機能している
- ログが正しく記録される

---

## Issue作成方法

### 方法1: スクリプトで一括作成

```bash
# GitHub Personal Access Tokenを設定
export GITHUB_TOKEN=your_token_here

# スクリプトを実行
cd syaryo_kanren_system
node create-issues.js
```

### 方法2: GitHub Webで手動作成

1. https://github.com/TatsumaMatsuo/syaryo_kanren_system/issues/new にアクセス
2. 上記の各Phaseの内容を参考にIssueを作成
3. 適切なラベルを付与

---

## 優先度の目安

- **P0-Critical**: プロジェクトの基盤となる機能。これがないと他の機能が実装できない
- **P1-High**: コア機能。システムの主要な要件を満たすために必須
- **P2-Medium**: 重要だが後回しにできる機能
- **P3-Low**: Nice to have な機能

## 推奨実装順序

1. Phase 1 (Setup)
2. Phase 2 (Lark Base)
3. Phase 3 (Auth)
4. Phase 4 (Application Forms) + Phase 5 (Admin Approval) を並行実装可能
5. Phase 6 (Expiration Management)
6. Phase 7 (Soft Delete)
7. Phase 8 (Permit)
8. Phase 9 (Tests) - 各Phaseと並行して実装するのが理想
9. Phase 10 (Deploy)

---

## 関連ドキュメント

- [REQUIREMENTS.md](./REQUIREMENTS.md) - 要件定義
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - データベース設計
- [ARCHITECTURE.md](./ARCHITECTURE.md) - システムアーキテクチャ
