# デプロイガイド

車両関連管理システムの本番環境へのデプロイ手順です。

## 前提条件

- [Vercel](https://vercel.com) アカウント
- [Sentry](https://sentry.io) アカウント（エラー監視用）
- Lark アプリケーションの本番設定完了

## 1. Vercelプロジェクトのセットアップ

### 1.1 プロジェクトのインポート

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. "Add New" → "Project" をクリック
3. GitHubリポジトリ `syaryo_kanren_system` を選択
4. Framework Preset: `Next.js` を選択
5. Root Directory: `.` (デフォルト)

### 1.2 環境変数の設定

Vercel Dashboard → Settings → Environment Variables で以下を設定：

#### Lark Base 設定（必須）
| 変数名 | 説明 |
|--------|------|
| `LARK_APP_ID` | Lark アプリケーションID |
| `LARK_APP_SECRET` | Lark アプリケーションシークレット |
| `LARK_BASE_TOKEN` | Lark Base トークン |
| `LARK_TABLE_DRIVERS_LICENSES` | 免許証テーブルID |
| `LARK_TABLE_VEHICLE_REGISTRATIONS` | 車検証テーブルID |
| `LARK_TABLE_INSURANCE_POLICIES` | 任意保険テーブルID |
| `LARK_TABLE_EMPLOYEES` | 社員マスタテーブルID |
| `LARK_TABLE_USER_PERMISSIONS` | ユーザー権限テーブルID |
| `LARK_TABLE_NOTIFICATION_HISTORY` | 通知履歴テーブルID |
| `LARK_APPROVAL_HISTORY_TABLE_ID` | 承認履歴テーブルID |

#### Lark OAuth 設定
| 変数名 | 説明 |
|--------|------|
| `LARK_OAUTH_CLIENT_ID` | OAuth クライアントID |
| `LARK_OAUTH_CLIENT_SECRET` | OAuth クライアントシークレット |
| `LARK_OAUTH_REDIRECT_URI` | `https://your-domain.vercel.app/api/auth/callback/lark` |

#### NextAuth 設定
| 変数名 | 説明 |
|--------|------|
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` で生成 |

#### Sentry 設定
| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN |
| `SENTRY_ORG` | Sentry 組織名 |
| `SENTRY_PROJECT` | Sentry プロジェクト名 |
| `SENTRY_AUTH_TOKEN` | Sentry 認証トークン |

#### その他
| 変数名 | 説明 |
|--------|------|
| `NODE_ENV` | `production` |
| `CRON_SECRET` | Cron認証用シークレット |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` |
| `LARK_BOT_WEBHOOK_URL` | Lark Bot Webhook URL |
| `LARK_DRIVE_FOLDER_ID` | Lark Drive フォルダID |

## 2. Sentryのセットアップ

### 2.1 Sentryプロジェクト作成

1. [Sentry](https://sentry.io) にログイン
2. "Create Project" → "Next.js" を選択
3. プロジェクト名: `syaryo-kanren-system`

### 2.2 DSNの取得

1. Project Settings → Client Keys (DSN)
2. DSN をコピーして `NEXT_PUBLIC_SENTRY_DSN` に設定

### 2.3 Auth Tokenの取得

1. Settings → Auth Tokens
2. "Create New Token" をクリック
3. スコープ: `project:releases`, `project:read`, `org:read`
4. トークンを `SENTRY_AUTH_TOKEN` に設定

## 3. Lark本番設定

### 3.1 OAuth リダイレクトURI

Lark Open Platform で本番URLを追加：
```
https://your-domain.vercel.app/api/auth/callback/lark
```

### 3.2 IP ホワイトリスト

Vercel のエッジサーバーIPは動的なため、IPホワイトリストは無効にするか、
Vercel の出口IPレンジを追加（推奨されない）

### 3.3 Webhook URL

通知機能を使用する場合、Lark Bot の Webhook URL を設定

## 4. GitHub Actions シークレット

リポジトリの Settings → Secrets and variables → Actions で設定：

| シークレット名 | 説明 |
|----------------|------|
| `LARK_APP_ID` | Lark アプリケーションID |
| `LARK_APP_SECRET` | Lark アプリケーションシークレット |
| `LARK_BASE_TOKEN` | Lark Base トークン |
| `NEXTAUTH_SECRET` | NextAuth シークレット |
| `VERCEL_TOKEN` | Vercel 認証トークン（自動デプロイ用） |
| `VERCEL_ORG_ID` | Vercel 組織ID |
| `VERCEL_PROJECT_ID` | Vercel プロジェクトID |

## 5. デプロイ

### 自動デプロイ

`main` ブランチへのプッシュで自動デプロイされます。

### 手動デプロイ

```bash
# Vercel CLI インストール
npm i -g vercel

# ログイン
vercel login

# プロダクションデプロイ
vercel --prod
```

## 6. デプロイ後の確認

### 6.1 ヘルスチェック

```bash
curl https://your-domain.vercel.app/api/health
```

### 6.2 Lark接続テスト

```bash
curl https://your-domain.vercel.app/api/test/lark-connection
```

### 6.3 Sentry動作確認

1. 意図的にエラーを発生させる
2. Sentryダッシュボードでエラーが記録されることを確認

## 7. Cronジョブ

有効期限チェックのCronジョブは毎日 UTC 00:00 (JST 09:00) に実行されます。

Vercel Dashboard → Cron Jobs で実行状況を確認できます。

## 8. トラブルシューティング

### ビルドエラー

```bash
# ローカルでビルドテスト
npm run build
```

### 環境変数エラー

- Vercel Dashboard で環境変数が正しく設定されているか確認
- `Production`, `Preview`, `Development` の各環境で設定が必要な場合がある

### Lark API エラー

- アプリケーションの権限スコープを確認
- Base のアクセス権限を確認
- OAuth リダイレクトURIを確認

### Sentry エラーが記録されない

- DSN が正しいか確認
- `NODE_ENV=production` が設定されているか確認
- ブラウザのアドブロッカーを無効化してテスト

## 9. 監視とアラート

### Vercel Analytics

Vercel Dashboard → Analytics で以下を監視：
- ページビュー
- Web Vitals (LCP, FID, CLS)
- エラー率

### Sentry Alerts

Sentry Dashboard → Alerts で設定：
- エラー発生時の通知
- パフォーマンス低下の通知

## 10. バックアップ

### Lark Base データ

定期的にLark Baseのデータをエクスポートしてバックアップ。

### 環境変数

`.env.production` ファイル（gitignore対象）として安全に保管。

---

## クイックスタートチェックリスト

- [ ] Vercelプロジェクト作成
- [ ] 環境変数設定（全項目）
- [ ] Sentryプロジェクト作成・連携
- [ ] Lark OAuth リダイレクトURI追加
- [ ] GitHub Actions シークレット設定
- [ ] 初回デプロイ実行
- [ ] ヘルスチェック確認
- [ ] Lark接続テスト確認
- [ ] Sentry動作確認
- [ ] Cronジョブ動作確認
