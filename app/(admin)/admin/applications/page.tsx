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

  const handleApprove = async (app: ApplicationOverview) => {
    if (!confirm("この申請を承認しますか？")) return;

    try {
      // 3つすべてを承認
      const results = await Promise.all([
        fetch(`/api/approvals/${app.license.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "license", action: "approve" }),
        }),
        fetch(`/api/approvals/${app.vehicle.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "vehicle", action: "approve" }),
        }),
        fetch(`/api/approvals/${app.insurance.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "insurance", action: "approve" }),
        }),
      ]);

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
    <div className="p-8">
      {/* ページヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">申請一覧</h1>
        <p className="mt-1 text-sm text-gray-600">
          マイカー通勤申請の承認・却下を行います
        </p>
      </div>

      {/* フィルター */}
      <div className="mb-6">
        <div className="flex space-x-4">
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
            {applications.map((app) => (
              <div key={app.employee.employee_id} className="bg-white rounded-lg shadow p-6">
                {/* 社員情報 */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {app.employee.employee_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      社員ID: {app.employee.employee_id} | {app.employee.department}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/admin/applications/${app.employee.employee_id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      詳細を表示
                    </button>
                    <button
                      onClick={() => handleApprove(app)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleReject(app)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      却下
                    </button>
                  </div>
                </div>

                {/* 3つの申請情報 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 免許証 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-medium">免許証</span>
                      </div>
                      {getStatusBadge(app.license.approval_status)}
                    </div>
                    <p className="text-sm text-gray-600">番号: {app.license.license_number}</p>
                    <p className="text-sm text-gray-600">
                      有効期限: {new Date(app.license.expiration_date).toLocaleDateString()}
                    </p>
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
                  </div>

                  {/* 車検証 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Car className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium">車検証</span>
                      </div>
                      {getStatusBadge(app.vehicle.approval_status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      車両番号: {app.vehicle.vehicle_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      車検期限:{" "}
                      {new Date(app.vehicle.inspection_expiration_date).toLocaleDateString()}
                    </p>
                    {app.vehicle.image_url && (
                      <button
                        onClick={() =>
                          handleViewImage(app.vehicle.image_url, `${app.employee.employee_name}さんの車検証`)
                        }
                        className="mt-2 flex items-center text-sm text-green-600 hover:text-green-800 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        画像を表示
                      </button>
                    )}
                  </div>

                  {/* 任意保険 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="font-medium">任意保険</span>
                      </div>
                      {getStatusBadge(app.insurance.approval_status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      証券番号: {app.insurance.policy_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      保険期限:{" "}
                      {new Date(app.insurance.coverage_end_date).toLocaleDateString()}
                    </p>
                    {app.insurance.image_url && (
                      <button
                        onClick={() =>
                          handleViewImage(app.insurance.image_url, `${app.employee.employee_name}さんの任意保険証`)
                        }
                        className="mt-2 flex items-center text-sm text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        画像を表示
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("却下理由を入力してください");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all([
        fetch(`/api/approvals/${application.license.id}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "license", reason }),
        }),
        fetch(`/api/approvals/${application.vehicle.id}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "vehicle", reason }),
        }),
        fetch(`/api/approvals/${application.insurance.id}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "insurance", reason }),
        }),
      ]);

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
          {application.employee.employee_name}さんの申請を却下します。却下理由を入力してください。
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
