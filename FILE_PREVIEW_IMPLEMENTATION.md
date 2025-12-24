# ファイルプレビュー機能 実装ガイド

## 📝 実装概要

管理者承認画面で、アップロードされた免許証・車検証・任意保険証の画像をモーダルでプレビューできる機能を実装しました。

## 🎯 実装内容

### 1. ファイル取得API

**新規ファイル**: `app/api/files/[fileKey]/route.ts`

#### エンドポイント詳細

```typescript
GET /api/files/:fileKey
```

#### 機能
- Lark IM File APIからfile_keyを使用してファイルをダウンロード
- ダウンロードしたバイナリデータを直接レスポンスとして返却
- ブラウザキャッシュを最適化（1年間のキャッシュ）

#### 実装コード

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { fileKey: string } }
) {
  try {
    const { fileKey } = params;

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    // Larkからファイルをダウンロード
    const response = await larkClient.im.file.get({
      path: {
        file_key: fileKey,
      },
    });

    if (!response.success || !response.data?.file) {
      return NextResponse.json(
        { error: "Failed to download file from Lark" },
        { status: 500 }
      );
    }

    const fileBuffer = response.data.file;

    // バイナリデータをレスポンスとして返す
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Failed to fetch file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### レスポンス

**成功時**:
- Content-Type: `image/jpeg`
- Body: バイナリ画像データ

**エラー時**:
```json
{
  "error": "File key is required" | "Failed to download file from Lark" | "Internal server error"
}
```

### 2. 管理者画面の更新

**更新ファイル**: `app/(admin)/admin/applications/page.tsx`

#### 追加された機能

##### a. 画像プレビュー状態管理

```typescript
const [imagePreview, setImagePreview] = useState<{
  show: boolean;
  imageUrl: string | null;
  title: string;
}>({ show: false, imageUrl: null, title: "" });
```

##### b. 画像表示ハンドラー

```typescript
const handleViewImage = (imageUrl: string, title: string) => {
  setImagePreview({
    show: true,
    imageUrl: `/api/files/${imageUrl}`,
    title,
  });
};

const closeImagePreview = () => {
  setImagePreview({ show: false, imageUrl: null, title: "" });
};
```

##### c. 表示ボタンの追加

各ドキュメントカード（免許証・車検証・任意保険証）に「画像を表示」ボタンを追加:

```typescript
{app.license.image_url && (
  <button
    onClick={() =>
      handleViewImage(app.license.image_url, `${app.employee.employee_name}さんの免許証`)
    }
    className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
  >
    <Eye className="h-4 w-4 mr-1" />
    画像を表示
  </button>
)}
```

### 3. 画像プレビューモーダル

**新規コンポーネント**: `ImagePreviewModal` (同ファイル内)

#### 特徴

1. **レスポンシブデザイン**
   - 最大幅4xl、最大高さ90vh
   - モバイルでも快適に閲覧可能

2. **ローディング状態**
   - 画像読み込み中はスピナーを表示
   - 読み込み完了まで画像を非表示

3. **エラーハンドリング**
   - 画像読み込み失敗時にエラーメッセージを表示
   - 赤いXアイコンで視覚的にエラーを通知

4. **使いやすいUI**
   - タイトル表示（誰の何の書類か）
   - 閉じるボタン（ヘッダーとフッターの2箇所）
   - 背景クリックではなくボタンでのみ閉じる（誤操作防止）

#### 実装コード

```typescript
function ImagePreviewModal({
  imageUrl,
  title,
  onClose,
}: {
  imageUrl: string | null;
  title: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 画像コンテンツ */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
          {loading && !error && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">画像を読み込み中...</p>
            </div>
          )}

          {error && (
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="mt-4 text-red-600">画像の読み込みに失敗しました</p>
            </div>
          )}

          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className={`max-w-full max-h-full object-contain ${loading ? "hidden" : ""}`}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 🔄 データフロー

### 画像表示のフロー

1. **ユーザー操作**: 管理者が「画像を表示」ボタンをクリック
2. **状態更新**: `handleViewImage()`が呼ばれ、imagePreview状態を更新
3. **モーダル表示**: `ImagePreviewModal`コンポーネントがレンダリング
4. **画像リクエスト**: ブラウザが`/api/files/:fileKey`にGETリクエスト
5. **Lark API呼び出し**: サーバーがLark IM File APIからファイルをダウンロード
6. **画像配信**: バイナリデータがブラウザに返却
7. **表示完了**: `<img>`タグのonLoadイベントでローディング状態を解除

### エラー時のフロー

1. **画像リクエスト失敗**: APIエラーまたはネットワークエラー
2. **onErrorハンドラー**: `<img>`のonErrorイベントが発火
3. **エラー状態更新**: `setError(true)`でエラー状態に切り替え
4. **エラーUI表示**: XCircleアイコンとエラーメッセージを表示

## 🎨 UI/UX 詳細

### アイコンの使用

- **Eye (目のアイコン)**: 画像を表示ボタン
- **X (×アイコン)**: モーダルを閉じるボタン
- **XCircle (×円アイコン)**: エラー表示

### 色分け

各ドキュメントタイプで色を統一:
- **免許証**: 青 (`text-blue-600`)
- **車検証**: 緑 (`text-green-600`)
- **任意保険**: 紫 (`text-purple-600`)

### レスポンシブ対応

```css
max-w-4xl        /* 最大幅 */
max-h-[90vh]     /* 最大高さ（画面の90%） */
overflow-hidden  /* はみ出し防止 */
object-contain   /* 画像のアスペクト比を維持 */
```

## 🧪 テスト方法

### 1. 画像プレビューのテスト

1. 管理者として`http://localhost:3001/admin/applications`にアクセス
2. 申請カード内の「画像を表示」ボタンをクリック
3. モーダルが開き、画像が表示されることを確認
4. ローディングスピナーが表示された後、画像が表示されることを確認
5. 「閉じる」ボタンまたはヘッダーの×ボタンでモーダルが閉じることを確認

### 2. エラーハンドリングのテスト

#### 無効なfile_keyの場合

```bash
# ブラウザで直接アクセス
http://localhost:3001/api/files/invalid_key
```

**期待される結果**: エラーメッセージが表示される

#### 画像が存在しない場合

管理者画面で存在しないfile_keyを持つ申請の画像を表示しようとした場合、エラーUIが表示されることを確認。

### 3. レスポンシブデザインのテスト

1. ブラウザの開発者ツールでデバイスシミュレーション
2. モバイル（375px）、タブレット（768px）、デスクトップ（1440px）で表示確認
3. 各サイズで画像が適切にフィットすることを確認

## 📊 パフォーマンス最適化

### 1. ブラウザキャッシュ

```typescript
headers: {
  "Cache-Control": "public, max-age=31536000, immutable",
}
```

- 1年間（31536000秒）のキャッシュ
- `immutable`フラグで再検証を不要に
- 同じ画像への再アクセス時は即座に表示

### 2. 条件付きレンダリング

```typescript
{app.license.image_url && (
  <button onClick={...}>画像を表示</button>
)}
```

- `image_url`が存在する場合のみボタンを表示
- 不要なDOMレンダリングを防止

### 3. ローディング状態の管理

```typescript
className={`max-w-full max-h-full object-contain ${loading ? "hidden" : ""}`}
```

- 読み込み中は画像を非表示
- レイアウトシフトを防止
- ユーザーエクスペリエンスの向上

## ⚠️ 注意事項

### セキュリティ

1. **認証チェック**: 現在、API `/api/files/:fileKey`には認証チェックがありません
   - **推奨**: `requireAdmin()`などの認証ミドルウェアを追加

2. **ファイルアクセス制御**: file_keyを知っていれば誰でもアクセス可能
   - **推奨**: ユーザーの権限に基づいてアクセス制限を実装

### Content-Type

現在、すべてのファイルに`image/jpeg`を設定しています。

**改善案**:
- Lark Baseに`file_type`フィールドを追加
- アップロード時にMIMEタイプを保存
- ダウンロード時に正しいContent-Typeを設定

```typescript
// 理想的な実装
const mimeTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};

const contentType = mimeTypes[fileType] || "application/octet-stream";
```

### エラーメッセージ

現在のエラーメッセージは汎用的です。

**改善案**:
- より具体的なエラーメッセージ
- エラーコードの追加
- ユーザーへの対処方法の提示

## 🚀 将来の改善案

### 1. PDFプレビュー対応

現在は画像のみ対応。PDFファイルの場合:
- PDF.jsを使用したインラインプレビュー
- またはダウンロードボタンの提供

### 2. 画像の拡大縮小

- ピンチズーム対応（モバイル）
- ズームイン/ズームアウトボタン
- パンニング機能

### 3. 複数画像の一括表示

- カルーセルUI
- 左右矢印キーでの画像切り替え
- サムネイル一覧

### 4. ダウンロード機能

```typescript
<button onClick={() => window.open(`/api/files/${fileKey}/download`)}>
  <Download className="h-4 w-4 mr-1" />
  ダウンロード
</button>
```

### 5. 画像の回転

- 90度回転ボタン
- スマートフォンで撮影した縦長画像への対応

### 6. 比較表示

- 承認前後の書類を並べて表示
- 更新申請時の新旧比較

## 📝 実装チェックリスト

- ✅ ファイル取得APIの実装
- ✅ 管理者画面に画像表示ボタンを追加
- ✅ 画像プレビューモーダルの実装
- ✅ ローディング状態の表示
- ✅ エラーハンドリング
- ✅ レスポンシブデザイン
- ✅ ブラウザキャッシュの最適化
- ⬜ 認証チェックの追加（推奨）
- ⬜ Content-Typeの動的設定（推奨）
- ⬜ PDFプレビュー対応
- ⬜ 画像の拡大縮小機能

---

実装日: 2024-12-24
