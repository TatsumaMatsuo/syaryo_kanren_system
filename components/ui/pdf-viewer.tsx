"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Loader2,
} from "lucide-react";

// PDF.js Worker設定
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  title?: string;
}

export function PDFViewer({ fileUrl, title = "PDF" }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error("PDF load error:", err);
    setError("PDFの読み込みに失敗しました");
    setLoading(false);
  }, []);

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(3.0, prev + 0.2));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.2));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center text-white">
          <p className="text-red-400 mb-2">{error}</p>
          <a
            href={fileUrl}
            download
            className="inline-flex items-center px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            ダウンロード
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* コントロールバー */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-2">
          {/* ページナビゲーション */}
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="前のページ"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <span className="text-white text-sm min-w-[80px] text-center">
            {numPages > 0 ? `${pageNumber} / ${numPages}` : "- / -"}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="次のページ"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* ズームコントロール */}
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="縮小"
          >
            <ZoomOut className="w-4 h-4 text-white" />
          </button>
          <span className="text-white text-sm min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="拡大"
          >
            <ZoomIn className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={resetZoom}
            className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            title="リセット"
          >
            <RotateCw className="w-4 h-4 text-white" />
          </button>
          <a
            href={fileUrl}
            download
            className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            title="ダウンロード"
          >
            <Download className="w-4 h-4 text-white" />
          </a>
        </div>
      </div>

      {/* PDFコンテンツ */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-white mt-2">PDFを読み込み中...</p>
            </div>
          </div>
        )}
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          className="flex justify-center"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-xl"
          />
        </Document>
      </div>
    </div>
  );
}
