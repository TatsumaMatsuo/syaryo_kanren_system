# GitHub Issues 作成ガイド

## 📋 概要

syaryo_kanren_system（マイカー通勤申請システム）の未実装機能をGitHubイシューとして作成するためのガイドです。

## 🎯 作成済みのイシューテンプレート

`.github/ISSUE_TEMPLATE/` ディレクトリに8つのイシューテンプレートを作成しました。

### 優先度: High（3件）

| # | タイトル | 所要時間 | 説明 |
|---|---------|---------|------|
| 01 | 🔔 Lark Messenger通知機能 | 6-8h | 承認・却下時の自動通知 |
| 02 | 📜 承認履歴の記録機能 | 8-10h | 承認・却下履歴の記録と表示 |
| 03 | 🔒 ファイルAPIのセキュリティ強化 | 4-6h | 認証・認可チェックの追加（最優先） |

### 優先度: Medium（3件）

| # | タイトル | 所要時間 | 説明 |
|---|---------|---------|------|
| 04 | ✅ 個別承認・却下機能 | 6-8h | 書類ごとの個別承認 |
| 05 | 📄 Content-Type動的設定 | 3-4h | ファイル形式に応じたMIMEタイプ設定 |
| 06 | 📱 モバイル・タブレット対応 | 8-10h | レスポンシブデザインの改善 |

### 優先度: Low（2件）

| # | タイトル | 所要時間 | 説明 |
|---|---------|---------|------|
| 07 | 📄 PDFプレビュー対応 | 6-8h | PDF.jsによるPDF表示 |
| 08 | 🔄 画像回転機能 | 4-6h | 画像の90度回転 |

**合計所要時間**: 約45-62時間

## 🚀 GitHubイシューの作成方法

### 方法1: 自動スクリプト（推奨）

#### Windows (PowerShell)

```powershell
cd syaryo_kanren_system
.\scripts\create-issues.ps1
```

#### macOS / Linux (Bash)

```bash
cd syaryo_kanren_system
chmod +x scripts/create-issues.sh
./scripts/create-issues.sh
```

### 方法2: GitHub Web UI（手動）

1. リポジトリにアクセス: https://github.com/TatsumaMatsuo/syaryo_kanren_system
2. [Issues] タブをクリック
3. [New Issue] ボタンをクリック
4. テンプレートを選択して [Get started] をクリック
5. 内容を確認して [Submit new issue] をクリック

### 方法3: GitHub CLI（手動）

```bash
# 認証
gh auth login

# イシューを個別に作成
gh issue create \
  --repo TatsumaMatsuo/syaryo_kanren_system \
  --title "🔔 Lark Messenger通知機能の実装" \
  --label "enhancement,priority-high" \
  --template "01-lark-notification.md"
```

## 📊 実装推奨順序

### フェーズ1: セキュリティとコア機能（Week 1-2）

```
1. 🔒 ファイルAPIのセキュリティ強化 (#03)
   ├─ セキュリティリスクが高いため最優先
   ├─ 所要時間: 4-6時間
   └─ 依存: なし

2. 📜 承認履歴の記録機能 (#02)
   ├─ コア機能の追加
   ├─ 所要時間: 8-10時間
   └─ 依存: なし
```

### フェーズ2: ユーザーエクスペリエンス向上（Week 3-4）

```
3. 🔔 Lark Messenger通知機能 (#01)
   ├─ ユーザー通知の実装
   ├─ 所要時間: 6-8時間
   └─ 依存: #02（通知に履歴情報を含める場合）

4. ✅ 個別承認・却下機能 (#04)
   ├─ 柔軟な運用のため
   ├─ 所要時間: 6-8時間
   └─ 依存: なし
```

### フェーズ3: 品質向上（Week 5-6）

```
5. 📄 Content-Type動的設定 (#05)
   ├─ 技術的改善
   ├─ 所要時間: 3-4時間
   └─ 依存: なし（#07の前提条件）

6. 📱 モバイル・タブレット対応 (#06)
   ├─ レスポンシブ対応
   ├─ 所要時間: 8-10時間
   └─ 依存: なし
```

### フェーズ4: 追加機能（オプション）

```
7. 📄 PDFプレビュー対応 (#07)
   ├─ 所要時間: 6-8時間
   └─ 依存: #05（Content-Type動的設定）

8. 🔄 画像回転機能 (#08)
   ├─ 所要時間: 4-6時間
   └─ 依存: なし
```

## 🤖 Miyabi Agent 自動実行

イシューに `agent-execute` ラベルを追加すると、Miyabi Agentが自動的に実装を開始します。

### Agent実行推奨イシュー

明確な要件と成功条件が定義されているイシュー:

- ✅ #03: ファイルAPIのセキュリティ強化
- ✅ #05: Content-Type動的設定
- ⚠️ #01-02, #04, #06-08: 複雑な要件のため、手動実装を推奨

### Agent実行コマンド

```bash
# 特定のイシューでAgent実行
npx miyabi agent-run --issue 3

# 複数イシューで並列実行
npx miyabi agent-run --issue 3,5

# ドライラン（実行内容確認）
npx miyabi agent-run --issue 3 --dry-run
```

## 📝 イシュー作成時の注意事項

### ラベルの付け方

| ラベル | 使用タイミング |
|--------|---------------|
| `enhancement` | 新機能または機能強化 |
| `security` | セキュリティ関連 |
| `ui/ux` | ユーザーインターフェース改善 |
| `priority-high` | 優先度: 高 |
| `priority-medium` | 優先度: 中 |
| `priority-low` | 優先度: 低 |
| `agent-execute` | Miyabi Agent自動実行対象 |

### テンプレートのカスタマイズ

テンプレートは必要に応じて編集可能です:

```bash
# テンプレートファイルを編集
code .github/ISSUE_TEMPLATE/01-lark-notification.md
```

## 🔗 関連ドキュメント

### 実装ガイド

- [ADMIN_APPROVAL_IMPLEMENTATION.md](./ADMIN_APPROVAL_IMPLEMENTATION.md) - 管理者承認画面
- [SPLIT_VIEW_IMPLEMENTATION.md](./SPLIT_VIEW_IMPLEMENTATION.md) - 2分割ビュー
- [FILE_PREVIEW_IMPLEMENTATION.md](./FILE_PREVIEW_IMPLEMENTATION.md) - ファイルプレビュー
- [AUTHENTICATION_IMPLEMENTATION.md](./AUTHENTICATION_IMPLEMENTATION.md) - 認証機能
- [FILE_UPLOAD_IMPLEMENTATION.md](./FILE_UPLOAD_IMPLEMENTATION.md) - ファイルアップロード

### イシューテンプレート

- [.github/ISSUE_TEMPLATE/README.md](./.github/ISSUE_TEMPLATE/README.md) - テンプレート一覧

## 📞 サポート

質問や問題がある場合:

1. GitHubイシューを作成: https://github.com/TatsumaMatsuo/syaryo_kanren_system/issues
2. ディスカッションを開始: https://github.com/TatsumaMatsuo/syaryo_kanren_system/discussions

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

作成日: 2024-12-24
