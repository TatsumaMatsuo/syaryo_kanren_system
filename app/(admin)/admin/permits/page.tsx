"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Car,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface Permit {
  id: string;
  employee_id: string;
  employee_name: string;
  vehicle_id: string;
  vehicle_number: string;
  vehicle_model: string;
  issue_date: string;
  expiration_date: string;
  permit_file_key: string;
  verification_token: string;
  status: "valid" | "expired" | "revoked";
}

function getStatusBadge(status: Permit["status"]) {
  switch (status) {
    case "valid":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          <CheckCircle2 className="w-3 h-3" />
          有効
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          <XCircle className="w-3 h-3" />
          期限切れ
        </span>
      );
    case "revoked":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          <AlertCircle className="w-3 h-3" />
          取消済
        </span>
      );
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getExpirationStyle(dateString: string, status: Permit["status"]) {
  if (status !== "valid") return "";

  const expDate = new Date(dateString);
  const today = new Date();
  const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiration <= 0) {
    return "text-red-600 font-semibold bg-red-50 px-2 py-1 rounded";
  } else if (daysUntilExpiration <= 30) {
    return "text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded";
  } else if (daysUntilExpiration <= 60) {
    return "text-yellow-600 bg-yellow-50 px-2 py-1 rounded";
  }
  return "text-gray-700";
}

function getDaysUntilExpiration(dateString: string) {
  const expDate = new Date(dateString);
  const today = new Date();
  const days = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 0) return "期限切れ";
  if (days === 1) return "明日";
  if (days <= 30) return `残り${days}日`;
  return null;
}

export default function AdminPermitsPage() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateEmployeeId, setGenerateEmployeeId] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchPermits = async () => {
    try {
      const response = await fetch("/api/permits");
      const data = await response.json();

      if (data.success) {
        setPermits(data.permits);
      } else {
        setError(data.error || "許可証の取得に失敗しました");
      }
    } catch (err) {
      setError("許可証の取得中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermits();
  }, []);

  const handleDownload = async (permitId: string) => {
    window.open(`/api/permits/download/${permitId}`, "_blank");
  };

  const handleRegenerate = async (permitId: string) => {
    if (regenerating) return;

    setRegenerating(permitId);
    try {
      const response = await fetch(`/api/permits/${permitId}/regenerate`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        alert("許可証PDFを再生成しました");
        // リストを更新
        await fetchPermits();
      } else {
        alert(data.error || "再生成に失敗しました");
      }
    } catch (err) {
      alert("再生成中にエラーが発生しました");
    } finally {
      setRegenerating(null);
    }
  };

  const handleGenerateForEmployee = async () => {
    if (!generateEmployeeId.trim()) {
      alert("社員IDを入力してください");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/permits/generate-for-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: generateEmployeeId.trim() }),
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setShowGenerateModal(false);
        setGenerateEmployeeId("");
        await fetchPermits();
      } else {
        alert(data.error || "許可証の発行に失敗しました");
      }
    } catch (err) {
      alert("許可証の発行中にエラーが発生しました");
    } finally {
      setGenerating(false);
    }
  };

  // フィルタリング
  const filteredPermits = permits.filter((permit) => {
    const employeeName = permit.employee_name || "";
    const vehicleNumber = permit.vehicle_number || "";
    const matchesSearch =
      employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || permit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 統計
  const stats = {
    total: permits.length,
    valid: permits.filter((p) => p.status === "valid").length,
    expired: permits.filter((p) => p.status === "expired").length,
    revoked: permits.filter((p) => p.status === "revoked").length,
    noPdf: permits.filter((p) => !p.permit_file_key).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 許可証発行モーダル */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">許可証を発行</h2>
            <p className="text-sm text-gray-600 mb-4">
              全書類（免許証・車検証・保険証）が承認済みの社員に対して許可証を発行します。
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                社員ID
              </label>
              <input
                type="text"
                value={generateEmployeeId}
                onChange={(e) => setGenerateEmployeeId(e.target.value)}
                placeholder="例: EMP001"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                社員マスタに登録されている社員IDを入力してください
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setGenerateEmployeeId("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={generating}
              >
                キャンセル
              </button>
              <button
                onClick={handleGenerateForEmployee}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    発行中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    発行する
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">発行済み許可証</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            許可証を発行
          </button>
          <Link
            href="/admin/applications"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            申請一覧に戻る
          </Link>
        </div>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">総発行数</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">有効</p>
          <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">期限切れ</p>
          <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">取消済</p>
          <p className="text-2xl font-bold text-gray-600">{stats.revoked}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">PDF未生成</p>
          <p className="text-2xl font-bold text-orange-600">{stats.noPdf}</p>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="社員名または車両番号で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">すべて</option>
            <option value="valid">有効のみ</option>
            <option value="expired">期限切れ</option>
            <option value="revoked">取消済</option>
          </select>
        </div>
      </div>

      {/* 許可証一覧 */}
      {filteredPermits.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {permits.length === 0
              ? "発行済みの許可証はありません"
              : "条件に一致する許可証はありません"}
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  社員情報
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  車両情報
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                  発行日
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                  有効期限
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPermits.map((permit, index) => (
                <tr
                  key={permit.id}
                  className={`hover:bg-blue-50/50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {permit.employee_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ID: {permit.employee_id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Car className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {permit.vehicle_number}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {permit.vehicle_model}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {formatDate(permit.issue_date)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-sm ${getExpirationStyle(permit.expiration_date, permit.status)}`}>
                        {formatDate(permit.expiration_date)}
                      </span>
                      {permit.status === "valid" && getDaysUntilExpiration(permit.expiration_date) && (
                        <span className="text-xs text-gray-500">
                          ({getDaysUntilExpiration(permit.expiration_date)})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center gap-2">
                      {getStatusBadge(permit.status)}
                      {!permit.permit_file_key && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          PDF未生成
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      {permit.permit_file_key ? (
                        <button
                          onClick={() => handleDownload(permit.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          ダウンロード
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegenerate(permit.id)}
                          disabled={regenerating === permit.id}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
                        >
                          {regenerating === permit.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          PDF生成
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
