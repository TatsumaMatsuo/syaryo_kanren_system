# syaryo_kanren_system - Issue Templates

## 📋 未実装機能一覧

このディレクトリには、syaryo_kanren_system（マイカー通勤申請システム）の未実装機能のIssueテンプレートが含まれています。

## 🎯 優先度別イシュー

### 優先度: High（高）

| # | タイトル | タイプ | 説明 |
|---|---------|--------|------|
| 01 | 🔔 Lark Messenger通知機能 | feature | 承認・却下時の自動通知 |
| 02 | 📜 承認履歴の記録機能 | feature | 承認・却下履歴の記録と表示 |
| 03 | 🔒 ファイルAPIのセキュリティ強化 | security | 認証・認可チェックの追加 |

### 優先度: Medium（中）

| # | タイトル | タイプ | 説明 |
|---|---------|--------|------|
| 04 | ✅ 個別承認・却下機能 | feature | 書類ごとの個別承認 |
| 05 | 📄 Content-Type動的設定 | enhancement | ファイル形式に応じたMIMEタイプ設定 |
| 06 | 📱 モバイル・タブレット対応 | enhancement | レスポンシブデザインの改善 |

### 優先度: Low（低）

| # | タイトル | タイプ | 説明 |
|---|---------|--------|------|
| 07 | 📄 PDFプレビュー対応 | feature | PDF.jsによるPDF表示 |
| 08 | 🔄 画像回転機能 | feature | 画像の90度回転 |

## 🚀 GitHubへのイシュー作成方法

### 方法1: GitHub Web UIで手動作成

1. GitHubリポジトリにアクセス: https://github.com/TatsumaMatsuo/syaryo_kanren_system
2. [Issues] タブをクリック
3. [New Issue] → [Get started] をクリック
4. テンプレートを選択して作成

### 方法2: GitHub CLI（gh）で一括作成

```bash
# GitHub CLIのインストール（未インストールの場合）
# Windows
winget install GitHub.cli

# macOS
brew install gh

# 認証
gh auth login

# イシューを一括作成
cd syaryo_kanren_system
chmod +x scripts/create-issues.sh
./scripts/create-issues.sh
```

### 方法3: curlで手動作成

```bash
# GITHUB_TOKEN を .env に設定
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxx

# イシューを作成
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/TatsumaMatsuo/syaryo_kanren_system/issues \
  -d '{
    "title": "🔔 Lark Messenger通知機能の実装",
    "body": "...",
    "labels": ["enhancement", "priority-high"]
  }'
```

## 📊 実装順序の推奨

実装は以下の順序で進めることを推奨します：

### フェーズ1: セキュリティとコア機能（Week 1-2）

1. **🔒 ファイルAPIのセキュリティ強化** (Issue #03)
   - セキュリティリスクが高いため最優先
   - 所要時間: 4-6時間

2. **📜 承認履歴の記録機能** (Issue #02)
   - コア機能の追加
   - 所要時間: 8-10時間

### フェーズ2: ユーザーエクスペリエンス向上（Week 3-4）

3. **🔔 Lark Messenger通知機能** (Issue #01)
   - ユーザー通知の実装
   - 所要時間: 6-8時間

4. **✅ 個別承認・却下機能** (Issue #04)
   - 柔軟な運用のため
   - 所要時間: 6-8時間

### フェーズ3: 品質向上（Week 5-6）

5. **📄 Content-Type動的設定** (Issue #05)
   - 技術的改善
   - 所要時間: 3-4時間

6. **📱 モバイル・タブレット対応** (Issue #06)
   - レスポンシブ対応
   - 所要時間: 8-10時間

### フェーズ4: 追加機能（オプション）

7. **📄 PDFプレビュー対応** (Issue #07)
   - 所要時間: 6-8時間

8. **🔄 画像回転機能** (Issue #08)
   - 所要時間: 4-6時間

## 🏷️ ラベル体系

| ラベル | 説明 |
|--------|------|
| `enhancement` | 新機能または機能強化 |
| `security` | セキュリティ関連 |
| `ui/ux` | ユーザーインターフェース改善 |
| `priority-high` | 優先度: 高 |
| `priority-medium` | 優先度: 中 |
| `priority-low` | 優先度: 低 |
| `agent-execute` | Miyabi Agent自動実行対象 |

## 📝 イシュー作成時の注意事項

1. **優先度の判断**
   - セキュリティ関連は常に`priority-high`
   - コア機能は`priority-high`または`priority-medium`
   - UI/UX改善は`priority-medium`または`priority-low`

2. **Agent自動実行**
   - 明確な要件と成功条件が定義されているイシューには`agent-execute`ラベルを追加
   - Miyabi Agentが自動的に実装を開始

3. **依存関係**
   - Issue #03（セキュリティ）は最優先で実装
   - Issue #05（Content-Type）はIssue #07（PDF対応）の前提条件

## 🔗 関連ドキュメント

- [ADMIN_APPROVAL_IMPLEMENTATION.md](../../ADMIN_APPROVAL_IMPLEMENTATION.md) - 管理者承認画面実装ガイド
- [SPLIT_VIEW_IMPLEMENTATION.md](../../SPLIT_VIEW_IMPLEMENTATION.md) - 2分割ビュー実装ガイド
- [FILE_PREVIEW_IMPLEMENTATION.md](../../FILE_PREVIEW_IMPLEMENTATION.md) - ファイルプレビュー実装ガイド
- [AUTHENTICATION_IMPLEMENTATION.md](../../AUTHENTICATION_IMPLEMENTATION.md) - 認証機能実装ガイド

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
