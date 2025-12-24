---
name: モバイル・タブレット対応
about: 2分割ビューをモバイル・タブレットで最適化
title: '📱 モバイル・タブレット対応の実装'
labels: 'enhancement, priority-medium, ui/ux'
assignees: ''
---

## 📋 要件

- [ ] タブレット: タブ切り替えで左右パネルを切り替え
- [ ] モバイル: 縦スクロールレイアウト
- [ ] レスポンシブデザインの改善
- [ ] タッチ操作の最適化
- [ ] 画像ピンチズームの改善

## 🛠️ 技術スタック

- Tailwind CSS Responsive Design
- React useState
- react-zoom-pan-pinch
- CSS Media Queries

## 📝 説明

現在の2分割ビュー（左: 申請内容、右: 画像）は、小画面デバイスでは見づらい問題があります。デバイスサイズに応じた最適なレイアウトを実装します。

### 現在の問題

- **タブレット**: 2分割だと各パネルが狭すぎる
- **モバイル**: 横2分割が機能しない
- **タッチ操作**: ピンチズームがやや使いづらい

### 改善後の動作

#### デスクトップ (≥1024px)

```
┌──────────────┬──────────────┐
│              │              │
│  申請内容     │   画像       │
│              │              │
└──────────────┴──────────────┘
      50%            50%
```

#### タブレット (768px - 1023px)

```
┌─────────────────────────────┐
│ [申請内容] [画像]  ← タブ切替 │
├─────────────────────────────┤
│                             │
│   選択中のパネルを表示       │
│                             │
└─────────────────────────────┘
         100%幅
```

#### モバイル (< 768px)

```
┌─────────────────────────────┐
│   申請内容                   │
│                             │
├─────────────────────────────┤
│   画像                       │
│   (縮小表示)                 │
│                             │
│   [拡大表示] ← モーダル      │
└─────────────────────────────┘
      縦スクロール
```

## 📊 成功条件

- [ ] デスクトップ: 2分割ビューが正常に動作
- [ ] タブレット: タブ切り替えで快適に閲覧
- [ ] モバイル: 縦スクロールで全情報が閲覧可能
- [ ] タッチ操作がスムーズ

## 🔗 関連ファイル

- `app/(admin)/admin/applications/[employeeId]/page.tsx` - 詳細画面（2分割ビュー）
- `tailwind.config.ts` - Tailwindカスタム設定
- `components/ui/responsive-layout.tsx` - レスポンシブレイアウトコンポーネント（新規）

## 🎯 実装方針

### 1. Tailwind Breakpoints使用

```typescript
// デスクトップ: 2分割
<div className="flex flex-col lg:flex-row">
  <div className="w-full lg:w-1/2">申請内容</div>
  <div className="w-full lg:w-1/2">画像</div>
</div>
```

### 2. タブレット: useState でタブ管理

```typescript
const [activeTab, setActiveTab] = useState<"details" | "image">("details");

// タブレット表示時
<div className="md:flex lg:hidden">
  <button onClick={() => setActiveTab("details")}>申請内容</button>
  <button onClick={() => setActiveTab("image")}>画像</button>
</div>

{activeTab === "details" && <DetailsPanel />}
{activeTab === "image" && <ImagePanel />}
```

### 3. モバイル: 縦スクロール

```typescript
<div className="flex flex-col sm:hidden">
  <DetailsPanel />
  <ImagePanel />
</div>
```

## 📱 テスト対象デバイス

| デバイス | 解像度 | 対応 |
|---------|-------|------|
| iPhone SE | 375 x 667 | モバイル |
| iPhone 14 Pro | 393 x 852 | モバイル |
| iPad | 768 x 1024 | タブレット |
| iPad Pro | 1024 x 1366 | デスクトップ |
| Desktop | 1920 x 1080 | デスクトップ |

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
