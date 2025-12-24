---
name: Lark Messenger通知機能
about: 承認・却下時のLark Messenger通知実装
title: '🔔 Lark Messenger通知機能の実装'
labels: 'enhancement, priority-high'
assignees: ''
---

## 📋 要件

- [ ] 承認時の通知メッセージ送信機能
- [ ] 却下時の通知メッセージ送信機能（理由を含む）
- [ ] Lark Messenger APIとの連携
- [ ] 通知送信エラーハンドリング
- [ ] 通知テンプレートの作成

## 🛠️ 技術スタック

- Lark Messenger API
- TypeScript
- Next.js API Routes

## 📝 説明

承認・却下時にLark Messengerで申請者に自動通知を送信する機能を実装します。

### 承認時の通知例

```
【マイカー通勤申請】承認完了

山田太郎さん

あなたのマイカー通勤申請が承認されました。

📄 免許証: 承認済み
🚗 車検証: 承認済み
🛡️ 任意保険: 承認済み

承認者: 総務部 佐藤次郎
承認日時: 2024-12-24 14:30
```

### 却下時の通知例

```
【マイカー通勤申請】却下のお知らせ

山田太郎さん

申し訳ございませんが、あなたのマイカー通勤申請が却下されました。

却下理由:
免許証の有効期限が切れています。更新後に再度申請してください。

却下者: 総務部 佐藤次郎
却下日時: 2024-12-24 14:30

再申請は以下から行えます:
http://localhost:3001/dashboard
```

## 📊 成功条件

- [ ] TypeScript エラー: 0件
- [ ] 通知送信成功率: ≥99%
- [ ] エラーハンドリング実装済み
- [ ] ユニットテスト実装

## 🔗 関連ファイル

- `app/api/approvals/[id]/route.ts` - 承認API
- `app/api/approvals/[id]/reject/route.ts` - 却下API
- `lib/lark-client.ts` - Lark API クライアント

## 🎯 実装方針

1. `lib/lark-client.ts`に通知送信関数を追加
2. 承認・却下API内で通知関数を呼び出し
3. エラーハンドリング（通知失敗しても承認処理は成功）
4. 通知テンプレートの外部化

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
