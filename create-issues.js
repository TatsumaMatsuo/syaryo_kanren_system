const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const REPO_OWNER = 'TatsumaMatsuo';
const REPO_NAME = 'syaryo_kanren_system';

const issues = [
  {
    title: '【Phase 1】プロジェクト初期セットアップ',
    body: `## 概要
Next.js + TypeScript + Tailwind CSSを使用した車両関連管理システムの初期セットアップを行う

## タスク
- [ ] Next.js 14+ (App Router) プロジェクトの初期化
- [ ] TypeScript設定
- [ ] Tailwind CSS + Shadcn/ui のセットアップ
- [ ] ESLint + Prettier の設定
- [ ] ディレクトリ構造の作成（app/, components/, lib/, services/, types/）
- [ ] 環境変数設定ファイル (.env.example)
- [ ] README.mdの更新（開発環境セットアップ手順）

## 技術スタック
- Next.js 14+
- TypeScript
- Tailwind CSS
- Shadcn/ui

## 成功基準
- [ ] \`npm run dev\` でローカル開発サーバーが起動する
- [ ] TypeScriptのコンパイルエラーがない
- [ ] Tailwind CSSが正しく動作する

## 関連ドキュメント
- [ARCHITECTURE.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/ARCHITECTURE.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
    labels: ['type:feature', 'priority:P0-Critical', 'phase:planning', 'agent:coordinator']
  },
  {
    title: '【Phase 2】Lark Base連携の実装',
    body: `## 概要
Lark Base SDKを使用してデータベース操作機能を実装する

## タスク
- [ ] Lark Base SDK のインストールと設定
- [ ] Lark OAuth認証の実装
- [ ] データベーステーブルの作成（免許証、車検証、任意保険、社員マスタ）
- [ ] CRUD操作の実装
- [ ] 統合ビューの作成（3テーブル結合）

## 技術スタック
- Lark Base SDK
- Lark OAuth 2.0

## 成功基準
- [ ] Lark Baseへの接続が成功する
- [ ] 全テーブルのCRUD操作が正常に動作する
- [ ] 統合ビューでデータが正しく表示される

## 関連ドキュメント
- [DATABASE_SCHEMA.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/DATABASE_SCHEMA.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
    labels: ['type:feature', 'priority:P0-Critical', 'phase:development', 'agent:codegen']
  },
  {
    title: '【Phase 3】認証・ログイン機能の実装',
    body: `## 概要
NextAuth.jsとLark OAuthを使用した認証システムの実装

## タスク
- [ ] NextAuth.js のセットアップ
- [ ] Lark OAuthプロバイダーの設定
- [ ] ログイン画面の実装
- [ ] セッション管理
- [ ] ロールベースアクセス制御（申請者/管理者）
- [ ] 認証ミドルウェアの実装

## 技術スタック
- NextAuth.js
- Lark OAuth 2.0
- JWT

## 成功基準
- [ ] Larkアカウントでログインできる
- [ ] セッションが正しく管理される
- [ ] 役割に応じてアクセス制御が機能する

## 関連ドキュメント
- [ARCHITECTURE.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/ARCHITECTURE.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
    labels: ['type:feature', 'priority:P0-Critical', 'phase:development', 'agent:codegen', 'special:security']
  },
  {
    title: '【Phase 4】申請フォームの実装（免許証・車検証・任意保険）',
    body: `## 概要
申請者が免許証、車検証、任意保険証をアップロードし申請するフォームの実装

## タスク
- [ ] ファイルアップロードコンポーネントの実装（react-dropzone）
- [ ] 免許証申請フォームの実装
- [ ] 車検証申請フォームの実装
- [ ] 任意保険申請フォームの実装
- [ ] フォームバリデーション（React Hook Form + Zod）
- [ ] ファイルアップロードAPI（Lark Drive連携）
- [ ] プレビュー機能
- [ ] 申請データの保存（Lark Base）

## 技術スタック
- React Hook Form
- Zod
- react-dropzone
- Lark Drive API

## 成功基準
- [ ] 画像ファイルのアップロードが正常に動作する
- [ ] フォームバリデーションが正しく機能する
- [ ] 申請データがLark Baseに保存される
- [ ] モバイルでも使いやすいUI

## 関連ドキュメント
- [REQUIREMENTS.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/REQUIREMENTS.md)
- [DATABASE_SCHEMA.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/DATABASE_SCHEMA.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
    labels: ['type:feature', 'priority:P1-High', 'phase:development', 'agent:codegen']
  },
  {
    title: '【Phase 5】管理者承認画面の実装',
    body: `## 概要
管理者が申請を確認し、承認/却下を行う画面の実装

## タスク
- [ ] 申請一覧画面（統合ビュー）の実装
- [ ] 申請詳細画面の実装
- [ ] 承認ボタンの実装
- [ ] 却下ボタン + 理由入力フォームの実装
- [ ] ステータス更新処理（仮→本）
- [ ] チャット通知の送信
- [ ] フィルター・検索機能

## 技術スタック
- React
- Lark Messenger API
- Lark Base SDK

## 成功基準
- [ ] 統合ビューで3つのテーブルのデータが表示される
- [ ] 承認処理が正常に動作する
- [ ] 却下時に理由が記録される
- [ ] 申請者に通知が送信される

## 関連ドキュメント
- [REQUIREMENTS.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/REQUIREMENTS.md)
- [DATABASE_SCHEMA.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/DATABASE_SCHEMA.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
    labels: ['type:feature', 'priority:P1-High', 'phase:development', 'agent:codegen']
  },
  {
    title: '【Phase 6】有効期限管理・通知機能の実装',
    body: `## 概要
有効期限の監視と自動通知機能の実装

## タスク
- [ ] 日次バッチ処理の実装（Node-cron）
- [ ] 有効期限チェック処理
- [ ] 1週間前アラート送信機能
- [ ] 期限切れアラート送信機能
- [ ] 通知テンプレートの作成
- [ ] 通知履歴の記録
- [ ] 削除フラグのデータを除外するロジック

## 技術スタック
- Node-cron / BullMQ
- Lark Messenger API
- Lark Mail API

## 成功基準
- [ ] 日次バッチが正常に実行される
- [ ] 期限1週間前に申請者に通知が届く
- [ ] 期限切れ時に申請者と管理者に通知が届く
- [ ] 削除フラグのついたデータは通知対象外

## 関連ドキュメント
- [REQUIREMENTS.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/REQUIREMENTS.md)
- [DATABASE_SCHEMA.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/DATABASE_SCHEMA.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
    labels: ['type:feature', 'priority:P1-High', 'phase:development', 'agent:codegen']
  },
  {
    title: '【Phase 7】退職時の論理削除機能',
    body: `## 概要
退職時にデータに削除フラグを設定し、表示・通知対象から除外する機能の実装

## タスク
- [ ] 削除フラグ設定API の実装
- [ ] 削除フラグによるフィルタリング処理
- [ ] 社員マスタの雇用状態管理
- [ ] 一覧表示での削除データ除外
- [ ] 通知対象からの除外処理
- [ ] 管理画面での削除データ表示機能（オプション）

## 技術スタック
- Lark Base SDK

## 成功基準
- [ ] 削除フラグが正しく設定される
- [ ] 削除されたデータが一覧に表示されない
- [ ] 削除されたデータに通知が送信されない
- [ ] データは物理削除されず履歴が保持される

## 関連ドキュメント
- [REQUIREMENTS.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/REQUIREMENTS.md)
- [DATABASE_SCHEMA.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/DATABASE_SCHEMA.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
    labels: ['type:feature', 'priority:P2-Medium', 'phase:development', 'agent:codegen']
  },
  {
    title: '【Phase 8】許可証発行機能の実装',
    body: `## 概要
承認された申請者に対して許可証を発行する機能の実装

## タスク
- [ ] 許可証テンプレートのデザイン
- [ ] 許可証生成処理（PDF）
- [ ] 許可証表示画面
- [ ] 許可証ダウンロード機能
- [ ] QRコード生成（検証用）
- [ ] 許可証の有効期限表示

## 技術スタック
- PDF生成ライブラリ（PDFKit / jsPDF）
- QRコード生成（qrcode）

## 成功基準
- [ ] 承認後に許可証が生成される
- [ ] 許可証をPDFでダウンロードできる
- [ ] QRコードで許可証を検証できる
- [ ] モバイルでも表示できる

## 関連ドキュメント
- [REQUIREMENTS.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/REQUIREMENTS.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
    labels: ['type:feature', 'priority:P2-Medium', 'phase:development', 'agent:codegen']
  },
  {
    title: '【Phase 9】テスト実装',
    body: `## 概要
ユニットテスト、統合テスト、E2Eテストの実装

## タスク
- [ ] Jestのセットアップ
- [ ] React Testing Libraryのセットアップ
- [ ] ユニットテストの実装（コンポーネント、API）
- [ ] 統合テストの実装（申請フロー、承認フロー）
- [ ] E2Eテストの実装（Playwright / Cypress）
- [ ] テストカバレッジ80%以上達成
- [ ] CI/CDパイプラインへの組み込み

## 技術スタック
- Jest
- React Testing Library
- Playwright / Cypress

## 成功基準
- [ ] テストカバレッジ ≥ 80%
- [ ] 全テストがパスする
- [ ] CI/CDでテストが自動実行される

## 関連ドキュメント
- [ARCHITECTURE.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/ARCHITECTURE.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
    labels: ['type:test', 'priority:P1-High', 'phase:development', 'agent:codegen']
  },
  {
    title: '【Phase 10】デプロイ・インフラ設定',
    body: `## 概要
本番環境へのデプロイとCI/CDパイプラインの構築

## タスク
- [ ] Vercelプロジェクトのセットアップ
- [ ] 環境変数の設定（Production）
- [ ] GitHub Actionsの設定
- [ ] Sentryのセットアップ（エラー監視）
- [ ] パフォーマンスモニタリング設定
- [ ] ログ収集の設定
- [ ] バックアップ戦略の実装

## 技術スタック
- Vercel
- GitHub Actions
- Sentry
- Winston / Pino

## 成功基準
- [ ] 本番環境にデプロイできる
- [ ] CI/CDパイプラインが正常に動作する
- [ ] エラー監視が機能している
- [ ] ログが正しく記録される

## 関連ドキュメント
- [ARCHITECTURE.md](https://github.com/TatsumaMatsuo/syaryo_kanren_system/blob/main/ARCHITECTURE.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
    labels: ['type:feature', 'priority:P2-Medium', 'phase:deployment', 'agent:deploy']
  }
];

function createIssue(issue) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      title: issue.title,
      body: issue.body,
      labels: issue.labels
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Node.js',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 201) {
          const issueData = JSON.parse(responseData);
          console.log(`✓ Issue created: #${issueData.number} - ${issue.title}`);
          console.log(`  URL: ${issueData.html_url}`);
          resolve(issueData);
        } else {
          console.error(`✗ Failed to create issue: ${issue.title}`);
          console.error(`  Status: ${res.statusCode}`);
          console.error(`  Response: ${responseData}`);
          reject(new Error(`Failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`✗ Error creating issue: ${issue.title}`);
      console.error(`  Error: ${error.message}`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function createAllIssues() {
  console.log(`Creating ${issues.length} issues...\n`);

  for (const issue of issues) {
    try {
      await createIssue(issue);
      // Wait 1 second between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to create issue: ${error.message}`);
    }
  }

  console.log('\n✓ All issues created!');
}

createAllIssues().catch(console.error);
