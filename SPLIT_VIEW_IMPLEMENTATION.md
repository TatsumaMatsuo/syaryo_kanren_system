# 2分割ビュー 実装ガイド

## 📝 実装概要

管理者が申請内容を確認しやすくするため、左側に申請詳細、右側に拡大縮小可能な画像ビューアを配置した2分割レイアウトの詳細ページを実装しました。

## 🎯 実装内容

### 1. ライブラリの追加

**インストールしたパッケージ**: `react-zoom-pan-pinch`

```bash
npm install react-zoom-pan-pinch
```

#### 機能
- 画像の拡大・縮小（ズームイン/ズームアウト）
- パンニング（ドラッグで画像を移動）
- ピンチズーム対応（タッチデバイス）
- リセット機能

### 2. 申請詳細ページ

**新規ファイル**: `app/(admin)/admin/applications/[employeeId]/page.tsx`

#### ルーティング

```
/admin/applications/:employeeId
```

例: `/admin/applications/ou_xxxxx`

#### レイアウト構造

```
┌─────────────────────────────────────────────────┐
│ ヘッダー（社員名、承認/却下ボタン）                   │
├─────────────────┬───────────────────────────────┤
│                 │                               │
│   左パネル       │      右パネル                  │
│  （申請内容）     │   （画像ビューア）              │
│                 │                               │
│  - タブ切替      │   - 拡大縮小                   │
│  - 免許証        │   - パンニング                 │
│  - 車検証        │   - リセット                   │
│  - 任意保険      │   - ダウンロード               │
│                 │                               │
│  - 詳細情報      │                               │
│  - 承認ボタン    │                               │
│                 │                               │
└─────────────────┴───────────────────────────────┘
```

### 3. 左パネル: 申請内容

#### タブ切り替え

3つのドキュメントタイプをタブで切り替え:

```typescript
<button
  onClick={() => setSelectedDoc("license")}
  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
    selectedDoc === "license"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-600 hover:text-gray-900"
  }`}
>
  <FileText className="h-4 w-4" />
  <span className="font-medium">運転免許証</span>
  {getStatusBadge(application.license.approval_status)}
</button>
```

#### 表示される情報

**運転免許証:**
- 免許証番号
- 有効期限
- 承認状態

**車検証:**
- 車両番号
- 車検期限
- 承認状態

**任意保険証:**
- 証券番号
- 保険期限
- 承認状態

#### 承認・却下ボタン

各書類ごとに承認・却下が可能:

```typescript
<button
  onClick={handleApprove}
  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
>
  <CheckCircle className="inline h-5 w-5 mr-2" />
  この書類を承認
</button>
```

### 4. 右パネル: 画像ビューア

#### TransformWrapper の使用

```typescript
<TransformWrapper
  initialScale={1}
  minScale={0.5}
  maxScale={4}
  centerOnInit
>
  {({ zoomIn, zoomOut, resetTransform }) => (
    <>
      {/* ズームコントロール */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button onClick={() => zoomIn()}>
          <ZoomIn className="h-5 w-5 text-gray-700" />
        </button>
        <button onClick={() => zoomOut()}>
          <ZoomOut className="h-5 w-5 text-gray-700" />
        </button>
        <button onClick={() => resetTransform()}>
          <RotateCw className="h-5 w-5 text-gray-700" />
        </button>
        <a href={`/api/files/${currentDoc.image_url}`} download>
          <Download className="h-5 w-5 text-gray-700" />
        </a>
      </div>

      <TransformComponent>
        <img
          src={`/api/files/${currentDoc.image_url}`}
          alt={getDocumentTitle()}
          className="max-w-full max-h-full object-contain"
        />
      </TransformComponent>
    </>
  )}
</TransformWrapper>
```

#### ズームコントロール

画面右上に4つのボタンを配置:

1. **拡大 (ZoomIn)**: 画像を拡大
2. **縮小 (ZoomOut)**: 画像を縮小
3. **リセット (RotateCw)**: ズームとパンニングをリセット
4. **ダウンロード (Download)**: 画像をダウンロード

#### 操作方法

- **マウスホイール**: 拡大・縮小
- **ドラッグ**: 画像を移動（パンニング）
- **ダブルクリック**: 拡大
- **タッチデバイス**: ピンチズーム、スワイプでパンニング

### 5. 申請一覧ページの更新

**更新ファイル**: `app/(admin)/admin/applications/page.tsx`

#### 「詳細を表示」ボタンの追加

各申請カードに青いボタンを追加:

```typescript
<button
  onClick={() => router.push(`/admin/applications/${app.employee.employee_id}`)}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
>
  <ExternalLink className="h-4 w-4 mr-2" />
  詳細を表示
</button>
```

#### ボタンの配置順序

1. **詳細を表示** (青)
2. **承認** (緑)
3. **却下** (赤)

### 6. データフェッチング

#### APIエンドポイントの使用

```typescript
const response = await fetch(
  `/api/applications/overview?employeeId=${employeeId}`
);
```

既存のAPIエンドポイントに`employeeId`パラメータを追加して特定の社員の申請を取得。

### 7. 承認・却下フロー

#### 承認の流れ

1. ユーザーが「この書類を承認」または「承認」ボタンをクリック
2. 確認ダイアログを表示
3. 3つすべての書類（免許証・車検証・任意保険）を並列で承認
4. 成功トーストを表示
5. 申請一覧ページにリダイレクト

```typescript
const handleApprove = async () => {
  if (!application) return;
  if (!confirm("この申請を承認しますか？")) return;

  try {
    const results = await Promise.all([
      fetch(`/api/approvals/${application.license.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "license", action: "approve" }),
      }),
      fetch(`/api/approvals/${application.vehicle.id}`, {/*...*/}),
      fetch(`/api/approvals/${application.insurance.id}`, {/*...*/}),
    ]);

    const allSuccess = results.every((r) => r.ok);
    if (allSuccess) {
      toast.success(`${application.employee.employee_name}さんの申請を承認しました`);
      router.push("/admin/applications");
    }
  } catch (error) {
    toast.error("承認に失敗しました。もう一度お試しください。");
  }
};
```

#### 却下の流れ

1. ユーザーが「この書類を却下」または「却下」ボタンをクリック
2. モーダルダイアログを表示
3. 却下理由を入力（必須）
4. 3つすべての書類を並列で却下
5. 成功トーストを表示
6. 申請一覧ページにリダイレクト

## 🎨 UI/UX 特徴

### 1. レスポンシブデザイン

- **デスクトップ**: 50%/50%の2分割
- **タブレット以下**: 将来的にタブ切り替え（現在は2分割固定）

### 2. カラースキーム

#### 左パネル
- 背景: 白 (`bg-white`)
- タブ: アクティブ時に色が変わる
  - 免許証: 青 (`border-blue-600`)
  - 車検証: 緑 (`border-green-600`)
  - 任意保険: 紫 (`border-purple-600`)

#### 右パネル
- 背景: ダークグレー (`bg-gray-900`)
- コントロールバー: (`bg-gray-800`)
- ボタン: 白背景 (`bg-white`)

### 3. アイコンの使用

- **FileText**: 免許証
- **Car**: 車検証
- **Shield**: 任意保険
- **ZoomIn/ZoomOut**: 拡大・縮小
- **RotateCw**: リセット
- **Download**: ダウンロード
- **ArrowLeft**: 一覧に戻る

### 4. ステータスバッジ

タブに承認状態のバッジを表示:
- **審査中** (pending): 黄色
- **承認済み** (approved): 緑
- **却下** (rejected): 赤

## 🔄 ナビゲーションフロー

```
申請一覧ページ
   ↓
[詳細を表示] ボタンをクリック
   ↓
申請詳細ページ（2分割ビュー）
   ↓
[承認] または [却下] ボタンをクリック
   ↓
申請一覧ページにリダイレクト
```

## 🧪 テスト方法

### 1. 申請詳細ページへのアクセス

1. 管理者として `http://localhost:3001/admin/applications` にアクセス
2. 任意の申請カードの「詳細を表示」ボタンをクリック
3. 2分割レイアウトのページが表示される

### 2. タブ切り替えのテスト

1. 「運転免許証」タブをクリック → 免許証の情報と画像が表示
2. 「車検証」タブをクリック → 車検証の情報と画像が表示
3. 「任意保険証」タブをクリック → 任意保険の情報と画像が表示

### 3. 画像ズーム機能のテスト

1. **拡大ボタン**: 画像が拡大される
2. **縮小ボタン**: 画像が縮小される
3. **リセットボタン**: 画像が初期状態に戻る
4. **マウスホイール**: スクロールで拡大・縮小
5. **ドラッグ**: 画像を移動できる

### 4. ダウンロード機能のテスト

1. ダウンロードボタンをクリック
2. 画像がダウンロードされる

### 5. 承認・却下のテスト

#### 承認
1. 「この書類を承認」ボタンをクリック
2. 確認ダイアログで「OK」をクリック
3. 成功トーストが表示される
4. 申請一覧ページにリダイレクトされる

#### 却下
1. 「この書類を却下」ボタンをクリック
2. モーダルが表示される
3. 却下理由を入力
4. 「却下する」ボタンをクリック
5. 成功トーストが表示される
6. 申請一覧ページにリダイレクトされる

## 📊 パフォーマンス最適化

### 1. 条件付きレンダリング

```typescript
{currentDoc?.image_url ? (
  <TransformWrapper>{/* ... */}</TransformWrapper>
) : (
  <div className="flex items-center justify-center h-full">
    <p className="text-gray-400">画像がアップロードされていません</p>
  </div>
)}
```

### 2. メモ化

タブ切り替え時は状態のみ更新し、不要な再レンダリングを防止。

### 3. 遅延ローディング

画像は必要な時のみロード（APIエンドポイント経由）。

## ⚠️ 注意事項

### 現在の制限事項

1. **個別承認**: 現在は3つの書類をまとめて承認・却下（個別承認は未実装）
2. **モバイル対応**: 2分割レイアウトは小画面では見づらい可能性
3. **画像フォーマット**: PDFの場合は画像として表示できない
4. **回転機能**: 画像の回転機能は未実装

### 将来の改善案

1. **個別承認/却下**: 書類ごとに個別に承認・却下できるように
2. **タブレット・モバイル対応**: 小画面ではタブ切り替えで左右を切り替え
3. **PDF対応**: PDF.jsを使用したPDFプレビュー
4. **画像回転**: 90度ずつ回転できる機能
5. **比較モード**: 複数の書類を並べて表示
6. **全画面モード**: 画像のみを全画面表示

## 🚀 react-zoom-pan-pinch の使用方法

### 基本的な使い方

```typescript
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

<TransformWrapper
  initialScale={1}      // 初期ズーム倍率
  minScale={0.5}        // 最小ズーム倍率
  maxScale={4}          // 最大ズーム倍率
  centerOnInit          // 初期表示時に中央配置
>
  {({ zoomIn, zoomOut, resetTransform }) => (
    <>
      <button onClick={() => zoomIn()}>拡大</button>
      <button onClick={() => zoomOut()}>縮小</button>
      <button onClick={() => resetTransform()}>リセット</button>

      <TransformComponent>
        <img src="..." alt="..." />
      </TransformComponent>
    </>
  )}
</TransformWrapper>
```

### 主要なプロパティ

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `initialScale` | number | 初期ズーム倍率 (デフォルト: 1) |
| `minScale` | number | 最小ズーム倍率 |
| `maxScale` | number | 最大ズーム倍率 |
| `centerOnInit` | boolean | 初期表示時に中央配置 |
| `wheel` | object | マウスホイール設定 |
| `doubleClick` | object | ダブルクリック設定 |

### 主要な関数

| 関数 | 説明 |
|------|------|
| `zoomIn(step?)` | 拡大（オプションでステップ指定） |
| `zoomOut(step?)` | 縮小（オプションでステップ指定） |
| `resetTransform()` | ズームとパンニングをリセット |
| `setTransform(x, y, scale)` | 特定の位置とズームに設定 |

## 📝 実装チェックリスト

- ✅ react-zoom-pan-pinchのインストール
- ✅ 申請詳細ページの作成
- ✅ 2分割レイアウトの実装
- ✅ 左パネル: タブ切り替え
- ✅ 左パネル: 申請詳細表示
- ✅ 右パネル: 画像ビューア
- ✅ 右パネル: ズームコントロール
- ✅ 右パネル: ダウンロード機能
- ✅ 承認・却下ボタン
- ✅ 申請一覧ページへのリンク追加
- ✅ トースト通知の統合
- ⬜ モバイル対応の最適化
- ⬜ 個別承認機能
- ⬜ PDF対応
- ⬜ 画像回転機能

---

実装日: 2024-12-24
