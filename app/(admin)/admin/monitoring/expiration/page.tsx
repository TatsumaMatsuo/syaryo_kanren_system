"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  AlertCircle,
  FileText,
  Car,
  Shield,
  RefreshCw,
  Play,
} from "lucide-react";

interface ExpirationSummary {
  expiringCount: number;
  expiredCount: number;
  expiringByType: {
    license: number;
    vehicle: number;
    insurance: number;
  };
  expiredByType: {
    license: number;
    vehicle: number;
    insurance: number;
  };
}

export default function ExpirationMonitoringPage() {
  const [summary, setSummary] = useState<ExpirationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/monitoring/expiration");
      const data = await response.json();

      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch expiration summary:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleRunMonitor = async () => {
    if (!confirm("有効期限監視ジョブを手動実行しますか？")) return;

    setRunning(true);
    try {
      const response = await fetch("/api/monitoring/expiration/run", {
        method: "POST",
      });

      if (response.ok) {
        alert("監視ジョブを開始しました。通知が送信されます。");
        // 5秒後にサマリーを再取得
        setTimeout(() => {
          fetchSummary();
        }, 5000);
      } else {
        throw new Error("Failed to run monitor");
      }
    } catch (error) {
      console.error("Failed to run monitor:", error);
      alert("監視ジョブの実行に失敗しました");
    } finally {
      setRunning(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "license":
        return <FileText className="w-5 h-5 text-blue-600" />;
      case "vehicle":
        return <Car className="w-5 h-5 text-green-600" />;
      case "insurance":
        return <Shield className="w-5 h-5 text-purple-600" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "license":
        return "免許証";
      case "vehicle":
        return "車検証";
      case "insurance":
        return "任意保険";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <AlertTriangle className="h-8 w-8 mr-3 text-orange-600" />
                有効期限監視
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                書類の有効期限切れと期限切れ間近を監視します
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={fetchSummary}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-5 h-5 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                更新
              </button>
              <button
                onClick={handleRunMonitor}
                disabled={running}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                <Play className="w-5 h-5 mr-2" />
                {running ? "実行中..." : "手動実行"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* サマリーカード */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && !summary ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* 概要カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 期限切れ間近 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        期限切れ間近
                      </h2>
                      <p className="text-sm text-gray-600">
                        1週間以内に期限が切れる書類
                      </p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-orange-600">
                    {summary.expiringCount}
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(summary.expiringByType).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between p-2 bg-orange-50 rounded"
                    >
                      <div className="flex items-center">
                        {getTypeIcon(type)}
                        <span className="ml-2 text-sm font-medium">
                          {getTypeLabel(type)}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-orange-600">
                        {count}件
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 期限切れ */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        期限切れ
                      </h2>
                      <p className="text-sm text-gray-600">
                        有効期限が切れている書類
                      </p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-red-600">
                    {summary.expiredCount}
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(summary.expiredByType).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between p-2 bg-red-50 rounded"
                    >
                      <div className="flex items-center">
                        {getTypeIcon(type)}
                        <span className="ml-2 text-sm font-medium">
                          {getTypeLabel(type)}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-red-600">
                        {count}件
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 通知設定情報 */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    自動通知設定
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>• 毎日午前9時に自動で有効期限をチェックします</p>
                    <p>• 期限1週間前: 申請者に警告通知を送信</p>
                    <p>• 期限切れ: 申請者と管理者に緊急通知を送信</p>
                    <p>• 同じ通知は24時間以内に重複送信されません</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">データを取得できませんでした</p>
          </div>
        )}
      </main>
    </div>
  );
}
