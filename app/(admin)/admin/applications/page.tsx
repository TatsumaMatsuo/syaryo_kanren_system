"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ApplicationOverview } from "@/types";
import { CheckCircle, XCircle, Clock, FileText, Car, Shield, Eye, X, ExternalLink } from "lucide-react";
import { useToast, ToastContainer } from "@/components/ui/toast";

export default function AdminApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [applications, setApplications] = useState<ApplicationOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [selectedApp, setSelectedApp] = useState<ApplicationOverview | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{
    show: boolean;
    imageUrl: string | null;
    title: string;
  }>({ show: false, imageUrl: null, title: "" });

  // 未認証の場合はログインページにリダイレクト
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/applications/overview?filter=${filter}`);
      const data = await response.json();

      if (data.success) {
        setApplications(data.data || []);
      } else {
        setError(data.error || "申請の取得に失敗しました");
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      setError("申請の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            承認済み
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            審査中
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            却下
          </span>
        );
      default:
        return null;
    }
  };

  // pending状態のドキュメントを全て取得
  const getPendingDocuments = (app: ApplicationOverview) => {
    const pending: { type: string; id: string }[] = [];

    if (app.license?.approval_status === "pending") {
      pending.push({ type: "license", id: app.license.id });
    }
    app.vehicles.forEach((v) => {
      if (v.approval_status === "pending") {
        pending.push({ type: "vehicle", id: v.id });
      }
    });
    app.insurances.forEach((ins) => {
      if (ins.approval_status === "pending") {
        pending.push({ type: "insurance", id: ins.id });
      }
    });
    return pending;
  };

  // 承認サマリーを取得
  const getApprovalSummary = (app: ApplicationOverview) => {
    const docs: string[] = [];
    if (app.license) docs.push(app.license.approval_status);
    app.vehicles.forEach(v => docs.push(v.approval_status));
    app.insurances.forEach(i => docs.push(i.approval_status));

    return {
      approved: docs.filter(s => s === "approved").length,
      rejected: docs.filter(s => s === "rejected").length,
      pending: docs.filter(s => s === "pending").length,
      total: docs.length
    };
  };

  const handleApprove = async (app: ApplicationOverview) => {
    const pendingDocs = getPendingDocuments(app);
    if (pendingDocs.length === 0) {
      toast.error("承認待ちの書類がありません");
      return;
    }

    if (!confirm(`審査中の書類（${pendingDocs.length}件）をすべて承認しますか？`)) return;

    try {
      const results = await Promise.all(
        pendingDocs.map(doc =>
          fetch(`/api/approvals/${doc.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: doc.type, action: "approve" }),
          })
        )
      );

      const allSuccess = results.every(r => r.ok);
      if (allSuccess) {
        toast.success(`${app.employee.employee_name}さんの申請を承認しました`);
        fetchApplications();
      } else {
        throw new Error("Some approvals failed");
      }
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error("承認に失敗しました。もう一度お試しください。");
    }
  };

  const handleReject = (app: ApplicationOverview) => {
    setSelectedApp(app);
    setShowRejectModal(true);
  };

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

  // ローディング中
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // セッションがない場合は何も表示しない（リダイレクト中）
  if (!session || !session.user) {
    return null;
  }

  return (
    <div className="p-4 sm:p-8">
      {/* ページヘッダー */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">申請一覧</h1>
        <p className="mt-1 text-sm text-gray-600">
          マイカー通勤申請の承認・却下を行います
        </p>
      </div>

      {/* フィルター */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            承認待ち
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "approved"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            承認済み
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            すべて
          </button>
        </div>
      </div>

      {/* 申請一覧 */}
      <div>
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">申請がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const summary = getApprovalSummary(app);
              return (
                <div key={app.employee.employee_id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                  {/* 社員情報 */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {app.employee.employee_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        社員ID: {app.employee.employee_id} | {app.employee.department}
                      </p>
                      <div className="mt-2">
                        {summary.total === 0 ? (
                          <span className="text-xs text-gray-500">書類なし</span>
                        ) : summary.approved === summary.total ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            全{summary.total}件承認済み
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">
                            承認: {summary.approved} / 審査中: {summary.pending} / 却下: {summary.rejected} （計{summary.total}件）
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => router.push(`/admin/applications/${app.employee.employee_id}`)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        詳細
                      </button>
                      <button
                        onClick={() => handleApprove(app)}
                        disabled={summary.pending === 0}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        承認
                      </button>
                      <button
                        onClick={() => handleReject(app)}
                        disabled={summary.pending === 0}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        却下
                      </button>
                    </div>
                  </div>

                  {/* 書類情報 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 免許証（1:1） */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="font-medium">免許証</span>
                        </div>
                        {app.license ? getStatusBadge(app.license.approval_status) : (
                          <span className="text-xs text-gray-400">未登録</span>
                        )}
                      </div>
                      {app.license ? (
                        <>
                          <p className="text-sm text-gray-600">番号: {app.license.license_number}</p>
                          <p className="text-sm text-gray-600">
                            有効期限: {new Date(app.license.expiration_date).toLocaleDateString()}
                          </p>
                          {app.license.image_url && (
                            <button
                              onClick={() =>
                                handleViewImage(app.license!.image_url, `${app.employee.employee_name}さんの免許証`)
                              }
                              className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              画像を表示
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">未登録</p>
                      )}
                    </div>

                    {/* 車検証（1:多） */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Car className="h-5 w-5 text-green-600 mr-2" />
                          <span className="font-medium">車検証（{app.vehicles.length}件）</span>
                        </div>
                      </div>
                      {app.vehicles.length > 0 ? (
                        <div className="space-y-3">
                          {app.vehicles.map((vehicle, idx) => (
                            <div key={vehicle.id} className={idx > 0 ? "pt-3 border-t" : ""}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{vehicle.vehicle_number}</span>
                                {getStatusBadge(vehicle.approval_status)}
                              </div>
                              <p className="text-xs text-gray-600">
                                車検期限: {new Date(vehicle.inspection_expiration_date).toLocaleDateString()}
                              </p>
                              {vehicle.image_url && (
                                <button
                                  onClick={() =>
                                    handleViewImage(vehicle.image_url, `${app.employee.employee_name}さんの車検証（${vehicle.vehicle_number}）`)
                                  }
                                  className="mt-1 flex items-center text-xs text-green-600 hover:text-green-800 transition-colors"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  画像を表示
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">未登録</p>
                      )}
                    </div>

                    {/* 任意保険（1:多） */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Shield className="h-5 w-5 text-purple-600 mr-2" />
                          <span className="font-medium">任意保険（{app.insurances.length}件）</span>
                        </div>
                      </div>
                      {app.insurances.length > 0 ? (
                        <div className="space-y-3">
                          {app.insurances.map((insurance, idx) => (
                            <div key={insurance.id} className={idx > 0 ? "pt-3 border-t" : ""}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{insurance.policy_number}</span>
                                {getStatusBadge(insurance.approval_status)}
                              </div>
                              <p className="text-xs text-gray-600">
                                保険期限: {new Date(insurance.coverage_end_date).toLocaleDateString()}
                              </p>
                              {insurance.image_url && (
                                <button
                                  onClick={() =>
                                    handleViewImage(insurance.image_url, `${app.employee.employee_name}さんの任意保険証（${insurance.policy_number}）`)
                                  }
                                  className="mt-1 flex items-center text-xs text-purple-600 hover:text-purple-800 transition-colors"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  画像を表示
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">未登録</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 却下モーダル */}
      {showRejectModal && selectedApp && (
        <RejectModal
          application={selectedApp}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedApp(null);
          }}
          onReject={() => {
            toast.success(`${selectedApp.employee.employee_name}さんの申請を却下しました`);
            fetchApplications();
            setShowRejectModal(false);
            setSelectedApp(null);
          }}
        />
      )}

      {/* 画像プレビューモーダル */}
      {imagePreview.show && (
        <ImagePreviewModal
          imageUrl={imagePreview.imageUrl}
          title={imagePreview.title}
          onClose={closeImagePreview}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </div>
  );
}

function RejectModal({
  application,
  onClose,
  onReject,
}: {
  application: ApplicationOverview;
  onClose: () => void;
  onReject: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pending状態のドキュメントを全て取得
  const getPendingDocuments = () => {
    const pending: { type: string; id: string }[] = [];

    if (application.license?.approval_status === "pending") {
      pending.push({ type: "license", id: application.license.id });
    }
    application.vehicles.forEach((v) => {
      if (v.approval_status === "pending") {
        pending.push({ type: "vehicle", id: v.id });
      }
    });
    application.insurances.forEach((ins) => {
      if (ins.approval_status === "pending") {
        pending.push({ type: "insurance", id: ins.id });
      }
    });
    return pending;
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("却下理由を入力してください");
      return;
    }

    const pendingDocs = getPendingDocuments();
    if (pendingDocs.length === 0) {
      setError("却下する書類がありません");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        pendingDocs.map(doc =>
          fetch(`/api/approvals/${doc.id}/reject`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: doc.type, reason }),
          })
        )
      );

      const allSuccess = results.every(r => r.ok);
      if (allSuccess) {
        onReject();
      } else {
        throw new Error("Some rejections failed");
      }
    } catch (err) {
      console.error("Failed to reject:", err);
      setError("却下に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">申請を却下</h2>
        <p className="text-sm text-gray-600 mb-4">
          {application.employee.employee_name}さんの審査中書類をすべて却下します。却下理由を入力してください。
        </p>
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded-lg p-3 mb-4 h-32"
          placeholder="却下理由を入力..."
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "送信中..." : "却下する"}
          </button>
        </div>
      </div>
    </div>
  );
}

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

  // PDFかどうかを判定
  const isPdf = imageUrl?.toLowerCase().endsWith('.pdf');

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

        {/* 画像/PDFコンテンツ */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
          {loading && !error && !isPdf && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">画像を読み込み中...</p>
            </div>
          )}

          {error && (
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="mt-4 text-red-600">ファイルの読み込みに失敗しました</p>
            </div>
          )}

          {imageUrl && isPdf ? (
            <iframe
              src={imageUrl}
              className="w-full h-[70vh]"
              title={title}
            />
          ) : imageUrl && (
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
