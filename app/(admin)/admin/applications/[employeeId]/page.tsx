"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { ApplicationOverview } from "@/types";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Car,
  Shield,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
} from "lucide-react";
import { useToast, ToastContainer } from "@/components/ui/toast";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

type DocumentType = "license" | "vehicle" | "insurance";

export default function ApplicationDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const employeeId = params.employeeId as string;

  const [application, setApplication] = useState<ApplicationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentType>("license");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // 未認証の場合はログインページにリダイレクト
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // 申請データの取得
  useEffect(() => {
    if (!employeeId) return;

    const fetchApplication = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/applications/overview?employeeId=${employeeId}`
        );
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          setApplication(data.data[0]);
        } else {
          setError("申請が見つかりませんでした");
        }
      } catch (error) {
        console.error("Failed to fetch application:", error);
        setError("申請の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [employeeId]);

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
        fetch(`/api/approvals/${application.vehicle.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "vehicle", action: "approve" }),
        }),
        fetch(`/api/approvals/${application.insurance.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "insurance", action: "approve" }),
        }),
      ]);

      const allSuccess = results.every((r) => r.ok);
      if (allSuccess) {
        toast.success(`${application.employee.employee_name}さんの申請を承認しました`);
        router.push("/admin/applications");
      } else {
        throw new Error("Some approvals failed");
      }
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error("承認に失敗しました。もう一度お試しください。");
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const getCurrentDocument = () => {
    if (!application) return null;
    switch (selectedDoc) {
      case "license":
        return application.license;
      case "vehicle":
        return application.vehicle;
      case "insurance":
        return application.insurance;
    }
  };

  const getDocumentTitle = () => {
    switch (selectedDoc) {
      case "license":
        return "運転免許証";
      case "vehicle":
        return "車検証";
      case "insurance":
        return "任意保険証";
    }
  };

  const getDocumentIcon = () => {
    switch (selectedDoc) {
      case "license":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "vehicle":
        return <Car className="h-5 w-5 text-green-600" />;
      case "insurance":
        return <Shield className="h-5 w-5 text-purple-600" />;
    }
  };

  // ローディング中
  if (status === "loading" || loading) {
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

  // エラー表示
  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error || "申請が見つかりませんでした"}</p>
          <button
            onClick={() => router.push("/admin/applications")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            申請一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const currentDoc = getCurrentDocument();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/admin/applications")}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {application.employee.employee_name}さんの申請
                </h1>
                <p className="text-sm text-gray-600">
                  社員ID: {application.employee.employee_id} | {application.employee.department}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleApprove}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                承認
              </button>
              <button
                onClick={handleReject}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                却下
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ: 2分割レイアウト */}
      <div className="flex h-[calc(100vh-88px)]">
        {/* 左パネル: 申請内容 */}
        <div className="w-1/2 bg-white border-r overflow-y-auto">
          <div className="p-6">
            {/* ドキュメントタブ */}
            <div className="flex space-x-2 mb-6 border-b">
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
              <button
                onClick={() => setSelectedDoc("vehicle")}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  selectedDoc === "vehicle"
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Car className="h-4 w-4" />
                <span className="font-medium">車検証</span>
                {getStatusBadge(application.vehicle.approval_status)}
              </button>
              <button
                onClick={() => setSelectedDoc("insurance")}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  selectedDoc === "insurance"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Shield className="h-4 w-4" />
                <span className="font-medium">任意保険証</span>
                {getStatusBadge(application.insurance.approval_status)}
              </button>
            </div>

            {/* 申請詳細 */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                {getDocumentIcon()}
                <h2 className="text-xl font-bold text-gray-900">{getDocumentTitle()}</h2>
              </div>

              {/* 免許証の情報 */}
              {selectedDoc === "license" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">基本情報</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">免許証番号</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {application.license.license_number}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">有効期限</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {new Date(application.license.expiration_date).toLocaleDateString()}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">承認状態</dt>
                        <dd>{getStatusBadge(application.license.approval_status)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {/* 車検証の情報 */}
              {selectedDoc === "vehicle" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">基本情報</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">車両番号</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {application.vehicle.vehicle_number}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">車検期限</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {new Date(
                            application.vehicle.inspection_expiration_date
                          ).toLocaleDateString()}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">承認状態</dt>
                        <dd>{getStatusBadge(application.vehicle.approval_status)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {/* 任意保険の情報 */}
              {selectedDoc === "insurance" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">基本情報</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">証券番号</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {application.insurance.policy_number}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">保険期限</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {new Date(application.insurance.coverage_end_date).toLocaleDateString()}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">承認状態</dt>
                        <dd>{getStatusBadge(application.insurance.approval_status)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {/* 操作ボタン */}
              <div className="pt-4 border-t space-y-2">
                <button
                  onClick={handleApprove}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckCircle className="inline h-5 w-5 mr-2" />
                  この書類を承認
                </button>
                <button
                  onClick={handleReject}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <XCircle className="inline h-5 w-5 mr-2" />
                  この書類を却下
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右パネル: 画像ビューア */}
        <div className="w-1/2 bg-gray-900 flex flex-col">
          {/* 画像コントロールバー */}
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
            <h3 className="text-white font-medium">{getDocumentTitle()} - 画像</h3>
          </div>

          {/* 画像表示エリア */}
          <div className="flex-1 relative bg-gray-900">
            {currentDoc?.image_url ? (
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
                      <button
                        onClick={() => zoomIn()}
                        className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                        title="拡大"
                      >
                        <ZoomIn className="h-5 w-5 text-gray-700" />
                      </button>
                      <button
                        onClick={() => zoomOut()}
                        className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                        title="縮小"
                      >
                        <ZoomOut className="h-5 w-5 text-gray-700" />
                      </button>
                      <button
                        onClick={() => resetTransform()}
                        className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                        title="リセット"
                      >
                        <RotateCw className="h-5 w-5 text-gray-700" />
                      </button>
                      <a
                        href={`/api/files/${currentDoc.image_url}`}
                        download
                        className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                        title="ダウンロード"
                      >
                        <Download className="h-5 w-5 text-gray-700" />
                      </a>
                    </div>

                    <TransformComponent
                      wrapperClass="w-full h-full"
                      contentClass="w-full h-full flex items-center justify-center"
                    >
                      <img
                        src={`/api/files/${currentDoc.image_url}`}
                        alt={getDocumentTitle()}
                        className="max-w-full max-h-full object-contain"
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">画像がアップロードされていません</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 却下モーダル */}
      {showRejectModal && (
        <RejectModal
          application={application}
          onClose={() => setShowRejectModal(false)}
          onReject={() => {
            toast.success(`${application.employee.employee_name}さんの申請を却下しました`);
            router.push("/admin/applications");
          }}
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

      const allSuccess = results.every((r) => r.ok);
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
