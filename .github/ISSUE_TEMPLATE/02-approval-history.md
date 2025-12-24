---
name: 承認履歴の記録機能
about: 承認・却下の履歴を記録・表示する機能
title: '📜 承認履歴の記録機能の実装'
labels: 'enhancement, priority-high'
assignees: ''
---

## 📋 要件

- [ ] 承認履歴テーブルの作成（Lark Base）
- [ ] 承認・却下時に履歴を記録
- [ ] 履歴表示画面の実装
- [ ] タイムスタンプと承認者情報の記録
- [ ] フィルター・検索機能

## 🛠️ 技術スタック

- Lark Base API
- TypeScript
- Next.js
- React

## 📝 説明

誰がいつ承認・却下したかの履歴を記録し、管理者が確認できる画面を実装します。

### Lark Base テーブル設計

**テーブル名**: `approval_history`

| フィールド名 | 型 | 説明 |
|-------------|-----|------|
| record_id | text | レコードID（自動生成） |
| application_type | single_select | 申請種類（license/vehicle/insurance） |
| application_id | text | 申請レコードID |
| employee_id | text | 申請者のLark User ID |
| employee_name | text | 申請者名 |
| action | single_select | アクション（approved/rejected） |
| approver_id | text | 承認者のLark User ID |
| approver_name | text | 承認者名 |
| reason | text | 却下理由（却下時のみ） |
| timestamp | datetime | 承認・却下日時 |
| created_at | datetime | レコード作成日時 |

### 履歴表示画面

- 申請者ごとの履歴一覧
- 承認者ごとの承認実績
- 日付範囲でのフィルター
- アクション（承認/却下）でのフィルター

## 📊 成功条件

- [ ] TypeScript エラー: 0件
- [ ] 履歴記録漏れ: 0件
- [ ] 表示パフォーマンス: <1秒
- [ ] ユニットテスト実装

## 🔗 関連ファイル

- `app/api/approvals/[id]/route.ts` - 承認API
- `app/api/approvals/[id]/reject/route.ts` - 却下API
- `app/(admin)/admin/history/page.tsx` - 履歴表示画面（新規）
- `lib/lark-client.ts` - Lark API クライアント

## 🎯 実装方針

1. Lark Baseに`approval_history`テーブルを作成
2. 承認・却下API内で履歴記録関数を呼び出し
3. 履歴表示画面の実装
4. フィルター・検索機能の追加

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
