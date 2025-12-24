---
name: PDFプレビュー対応
about: PDFファイルをブラウザ内でプレビュー表示
title: '📄 PDFプレビュー対応の実装'
labels: 'enhancement, priority-low'
assignees: ''
---

## 📋 要件

- [ ] PDF.jsライブラリの統合
- [ ] PDFビューアコンポーネントの実装
- [ ] ページナビゲーション機能
- [ ] ズーム機能
- [ ] ダウンロード機能
- [ ] エラーハンドリング

## 🛠️ 技術スタック

- PDF.js
- react-pdf
- TypeScript
- React

## 📝 説明

現在、画像ファイル（JPEG, PNG）のみプレビュー表示できますが、PDFファイルはダウンロードが必要です。PDFをブラウザ内で直接プレビューできるようにします。

### 現在の動作

```
PDFファイル → ❌ プレビュー不可
            → ダウンロードして外部ビューアで確認
```

### 改善後の動作

```
PDFファイル → ✅ ブラウザ内でプレビュー
            → ページナビゲーション
            → ズーム機能
            → ダウンロードも可能
```

## 📊 UIデザイン

### PDFビューア

```
┌─────────────────────────────┐
│ ← → [1/5] 拡大 縮小 ダウンロード │
├─────────────────────────────┤
│                             │
│    PDFコンテンツ             │
│                             │
│                             │
└─────────────────────────────┘
```

### コントロール

- **← →**: 前/次ページ
- **[1/5]**: 現在ページ / 総ページ数
- **拡大/縮小**: ズームイン/アウト
- **ダウンロード**: PDFをダウンロード

## 📊 成功条件

- [ ] PDF表示が正常に動作
- [ ] ページナビゲーションがスムーズ
- [ ] ズーム機能が使いやすい
- [ ] モバイルでも快適に閲覧可能
- [ ] 大きなPDFでもパフォーマンス良好

## 🔗 関連ファイル

- `app/(admin)/admin/applications/[employeeId]/page.tsx` - 詳細画面
- `components/ui/pdf-viewer.tsx` - PDFビューアコンポーネント（新規）
- `app/api/files/[fileKey]/route.ts` - ファイル取得API

## 🎯 実装方針

### 1. ライブラリのインストール

```bash
npm install react-pdf pdfjs-dist
npm install -D @types/pdfjs-dist
```

### 2. PDFビューアコンポーネント

```typescript
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function PDFViewer({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <div>
      {/* コントロール */}
      <div className="controls">
        <button onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}>
          ←
        </button>
        <span>{pageNumber} / {numPages}</span>
        <button onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}>
          →
        </button>
        <button onClick={() => setScale(scale + 0.1)}>+</button>
        <button onClick={() => setScale(Math.max(0.5, scale - 0.1))}>-</button>
      </div>

      {/* PDFドキュメント */}
      <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
        <Page pageNumber={pageNumber} scale={scale} />
      </Document>
    </div>
  );
}
```

### 3. ファイルタイプ判定

```typescript
// 詳細画面
const currentDoc = getCurrentDocument();
const isPDF = currentDoc?.file_mime_type === "application/pdf";

{isPDF ? (
  <PDFViewer fileUrl={`/api/files/${currentDoc.image_url}`} />
) : (
  <ImageViewer fileUrl={`/api/files/${currentDoc.image_url}`} />
)}
```

## 📚 PDF.js 設定

### Worker設定（必須）

```typescript
// app/layout.tsx または専用ファイル
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();
```

### CSS Import

```typescript
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
```

## ⚠️ パフォーマンス考慮事項

| 問題 | 対策 |
|------|------|
| 大きなPDFの読み込みが遅い | プログレスバー表示 |
| メモリ消費が大きい | ページ単位でレンダリング |
| 初回表示が遅い | Worker事前ロード |

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
