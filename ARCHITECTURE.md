# システムアーキテクチャ設計書

## システム概要図

```
┌─────────────────────────────────────────────────────────────┐
│                        クライアント層                          │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   PC Web     │              │  Mobile Web  │            │
│  │  ブラウザ     │              │   ブラウザ    │            │
│  └──────────────┘              └──────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                     アプリケーション層                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Webアプリケーション (Node.js/Next.js)        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │  │   認証    │  │ ファイル  │  │  通知     │         │   │
│  │  │  モジュール│  │アップロード│  │ モジュール │         │   │
│  │  └──────────┘  └──────────┘  └──────────┘         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │  │ 申請処理  │  │ 承認処理  │  │期限管理   │         │   │
│  │  │ モジュール│  │ モジュール│  │モジュール  │         │   │
│  │  └──────────┘  └──────────┘  └──────────┘         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ API
┌─────────────────────────────────────────────────────────────┐
│                       データ・サービス層                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Lark Base   │  │Lark Messenger│  │ファイルストレージ│    │
│  │  (Database)  │  │  (Chat通知)  │  │  (画像保存)   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **UIライブラリ**:
  - React 18+
  - Tailwind CSS (スタイリング)
  - Shadcn/ui または Ant Design (UIコンポーネント)
- **状態管理**: React Context API / Zustand
- **フォーム管理**: React Hook Form + Zod (バリデーション)
- **ファイルアップロード**: react-dropzone

### バックエンド
- **ランタイム**: Node.js 20+
- **フレームワーク**: Next.js API Routes
- **言語**: TypeScript
- **認証**: NextAuth.js (Lark OAuth連携)
- **データベースクライアント**: Lark Base SDK

### データ・ストレージ
- **データベース**: Lark Base
- **ファイルストレージ**: Lark Drive / AWS S3 / Cloudflare R2
- **キャッシュ**: Redis (セッション管理、通知キュー)

### 通知システム
- **チャット通知**: Lark Messenger API
- **メール通知**: Lark Mail API
- **スケジューラ**: Node-cron / BullMQ

### インフラ・デプロイ
- **ホスティング**: Vercel / AWS / Cloud Run
- **CI/CD**: GitHub Actions
- **モニタリング**: Sentry (エラー監視)
- **ログ**: Winston / Pino

---

## アプリケーション構成

### ディレクトリ構造（Next.js App Router）

```
syaryo_kanren_system/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── logout/
│   ├── (applicant)/              # 申請者用画面
│   │   ├── dashboard/
│   │   ├── license/
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── vehicle/
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── insurance/
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   └── permit/
│   ├── (admin)/                  # 管理者用画面
│   │   ├── applications/
│   │   ├── expiration-alerts/
│   │   └── employees/
│   ├── api/
│   │   ├── auth/
│   │   ├── applications/
│   │   ├── approvals/
│   │   ├── notifications/
│   │   └── webhooks/
│   └── layout.tsx
├── components/
│   ├── ui/                       # 共通UIコンポーネント
│   ├── forms/                    # フォームコンポーネント
│   ├── layouts/
│   └── features/
│       ├── application/
│       ├── approval/
│       └── notification/
├── lib/
│   ├── lark/                     # Lark Base/Messenger SDK
│   ├── utils/
│   ├── validations/              # Zodスキーマ
│   └── constants/
├── services/
│   ├── application.service.ts
│   ├── approval.service.ts
│   ├── notification.service.ts
│   └── expiration.service.ts
├── types/
│   ├── application.ts
│   ├── employee.ts
│   └── notification.ts
└── public/
```

---

## 主要機能モジュール

### 1. 認証モジュール
- **技術**: NextAuth.js + Lark OAuth
- **機能**:
  - Larkアカウント連携ログイン
  - セッション管理
  - 役割ベースアクセス制御 (RBAC)
  - 申請者/管理者の権限分離

### 2. ファイルアップロードモジュール
- **技術**: react-dropzone + multer / Lark Drive API
- **機能**:
  - 画像ファイルのドラッグ&ドロップアップロード
  - ファイル形式検証（JPEG, PNG, PDF）
  - ファイルサイズ制限（最大10MB）
  - プレビュー機能
  - Lark Driveへの保存

### 3. 申請処理モジュール
- **機能**:
  - 免許証/車検証/任意保険の申請フォーム
  - 入力バリデーション
  - 申請データのLark Baseへの保存
  - ステータス管理（仮→本）

### 4. 承認処理モジュール
- **機能**:
  - 申請一覧の統合ビュー表示
  - 申請詳細の確認
  - 承認/却下処理
  - 却下理由の入力
  - チャット通知の送信

### 5. 期限管理モジュール
- **技術**: Node-cron / BullMQ
- **機能**:
  - 日次バッチ処理（有効期限チェック）
  - 1週間前アラート送信
  - 期限切れアラート送信
  - 通知履歴の記録

### 6. 通知モジュール
- **技術**: Lark Messenger API
- **機能**:
  - チャット通知（承認/却下）
  - 有効期限アラート通知
  - 管理者への期限切れ通知
  - 通知テンプレート管理

---

## データフロー

### 申請フロー

```
申請者 → フォーム入力 → ファイルアップロード
                ↓
          バリデーション
                ↓
    Lark Base (status: temporary, approval_status: pending)
                ↓
       管理者に通知（チャット）
                ↓
         管理者が確認・判断
                ↓
    ┌──────────┴──────────┐
    │                     │
  承認                   却下
    │                     │
status: approved    rejection_reason記録
    │                     │
申請者に通知         申請者に通知（理由付き）
    │
許可証発行可能
```

### 有効期限管理フロー

```
日次バッチ実行 (毎日AM 9:00)
        ↓
Lark Base から有効期限データ取得
        ↓
┌───────┴───────┐
│               │
1週間前      期限切れ
│               │
申請者に通知  申請者 + 管理者に通知
```

---

## API設計

### REST API エンドポイント

#### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/session` - セッション取得

#### 申請（申請者）
- `POST /api/applications/license` - 免許証申請
- `POST /api/applications/vehicle` - 車検証申請
- `POST /api/applications/insurance` - 任意保険申請
- `GET /api/applications/my` - 自分の申請一覧
- `GET /api/applications/:id` - 申請詳細

#### 承認（管理者）
- `GET /api/approvals` - 承認待ち一覧
- `POST /api/approvals/:id/approve` - 承認
- `POST /api/approvals/:id/reject` - 却下

#### 有効期限管理
- `GET /api/expirations/alerts` - 期限アラート一覧
- `GET /api/expirations/upcoming` - 期限間近データ

#### 通知
- `POST /api/notifications/send` - 通知送信
- `GET /api/notifications/history` - 通知履歴

#### ファイル
- `POST /api/files/upload` - ファイルアップロード
- `GET /api/files/:id` - ファイル取得

---

## セキュリティ設計

### 認証・認可
- **Lark OAuth 2.0** による認証
- **JWT** によるセッション管理
- **ロールベースアクセス制御** (applicant/admin)

### データ保護
- **HTTPS** 通信の強制
- **個人情報の暗号化** (at rest & in transit)
- **ファイルアップロード制限**:
  - ファイル形式チェック
  - ファイルサイズ制限
  - ウイルススキャン（オプション）

### アクセス制御
- 申請者は**自分のデータのみ**参照・編集可能
- 管理者は全データ参照可能、承認/却下権限あり
- 削除フラグのついたデータは非表示

---

## パフォーマンス最適化

### フロントエンド
- **コード分割** (Next.js dynamic import)
- **画像最適化** (Next.js Image コンポーネント)
- **キャッシング** (SWR / React Query)
- **遅延ロード** (react-lazyload)

### バックエンド
- **Redis キャッシュ** (セッション、頻繁に参照されるデータ)
- **データベースインデックス** (employee_id, 有効期限)
- **非同期処理** (通知送信、ファイルアップロード)

---

## モニタリング・ログ

### エラー監視
- **Sentry** によるエラートラッキング
- **アラート通知** (重大エラー発生時)

### アクセスログ
- **Winston / Pino** によるログ記録
- ログレベル: ERROR, WARN, INFO, DEBUG

### メトリクス
- API レスポンスタイム
- ファイルアップロード成功率
- 通知送信成功率

---

## デプロイ戦略

### CI/CD パイプライン (GitHub Actions)

```yaml
main ブランチへのプッシュ
  ↓
Lint & Test
  ↓
Build
  ↓
Deploy to Production (Vercel)
  ↓
Smoke Test
```

### 環境管理
- **Development**: ローカル開発環境
- **Staging**: テスト環境（Lark Base Sandbox）
- **Production**: 本番環境

---

## 今後の拡張性

### フェーズ2の機能候補
- **統計ダッシュボード** (申請数、承認率等)
- **バッチ承認機能** (複数申請の一括承認)
- **電子署名** (デジタル許可証)
- **モバイルアプリ** (React Native)
- **多言語対応** (i18n)
- **OCR機能** (証明書の自動読み取り)
