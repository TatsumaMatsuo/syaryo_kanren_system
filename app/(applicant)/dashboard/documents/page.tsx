"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Car,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Eye,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface DocumentData {
  id: string;
  employee_id: string;
  approval_status: string;
  rejection_reason?: string;
  image_url?: string;
  // License specific
  license_number?: string;
  expiration_date?: string;
  // Vehicle specific
  vehicle_number?: string;
  inspection_expiration_date?: string;
  // Insurance specific
  policy_number?: string;
  coverage_start_date?: string;
  coverage_end_date?: string;
}

interface MyDocuments {
  license: DocumentData | null;
  vehicle: DocumentData | null;
  insurance: DocumentData | null;
}

export default function MyDocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [documents, setDocuments] = useState<MyDocuments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<"license" | "vehicle" | "insurance" | null>(null);

  // 未認証の場合はログインページにリダイレクト
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // 書類データを取得
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("/api/my-documents");
        const data = await response.json();

        if (data.success) {
          setDocuments(data.data);
        } else {
          setError(data.error || "書類の取得に失敗しました");
        }
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        setError("書類の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchDocuments();
    }
  }, [status]);

  const getStatusBadge = (status: string | undefined) => {
    if (!status) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          <Clock className="w-4 h-4 mr-1" />
          未申請
        </span>
      );
    }

    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            承認済み
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            審査中
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1" />
            却下
          </span>
        );
      default:
        return null;
    }
  };

  const isExpiringSoon = (dateStr: string | undefined) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (dateStr: string | undefined) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date < new Date();
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

  // セッションがない場合は何も表示しない
  if (!session || !session.user) {
    return null;
  }

  const user = {
    name: session.user.name || "ゲスト",
    employee_id: (session.user as any).id || session.user.email || "N/A",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">承認済書類照会</h1>
              <p className="mt-1 text-sm text-gray-600">
                {user.name}さん（社員ID: {user.employee_id}）
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 書類カード一覧 */}
          <div className="space-y-4">
            {/* 免許証 */}
            <div
              onClick={() => setSelectedDoc("license")}
              className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all ${
                selectedDoc === "license" ? "ring-2 ring-blue-500" : "hover:shadow-lg"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-10 w-10 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">運転免許証</h3>
                </div>
                {getStatusBadge(documents?.license?.approval_status)}
              </div>
              {documents?.license ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">免許証番号:</span>
                    <span className="font-medium">{documents.license.license_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">有効期限:</span>
                    <span className={`font-medium ${
                      isExpired(documents.license.expiration_date) ? "text-red-600" :
                      isExpiringSoon(documents.license.expiration_date) ? "text-yellow-600" : ""
                    }`}>
                      {documents.license.expiration_date
                        ? new Date(documents.license.expiration_date).toLocaleDateString()
                        : "-"}
                      {isExpired(documents.license.expiration_date) && (
                        <AlertTriangle className="inline w-4 h-4 ml-1 text-red-600" />
                      )}
                      {isExpiringSoon(documents.license.expiration_date) && (
                        <AlertTriangle className="inline w-4 h-4 ml-1 text-yellow-600" />
                      )}
                    </span>
                  </div>
                  {documents.license.approval_status === "rejected" && documents.license.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                      却下理由: {documents.license.rejection_reason}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">まだ申請されていません</p>
              )}
              <div className="mt-4 flex justify-end">
                <button className="text-blue-600 text-sm font-medium flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  詳細を見る
                </button>
              </div>
            </div>

            {/* 車検証 */}
            <div
              onClick={() => setSelectedDoc("vehicle")}
              className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all ${
                selectedDoc === "vehicle" ? "ring-2 ring-green-500" : "hover:shadow-lg"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Car className="h-10 w-10 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">車検証</h3>
                </div>
                {getStatusBadge(documents?.vehicle?.approval_status)}
              </div>
              {documents?.vehicle ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">車両番号:</span>
                    <span className="font-medium">{documents.vehicle.vehicle_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">車検期限:</span>
                    <span className={`font-medium ${
                      isExpired(documents.vehicle.inspection_expiration_date) ? "text-red-600" :
                      isExpiringSoon(documents.vehicle.inspection_expiration_date) ? "text-yellow-600" : ""
                    }`}>
                      {documents.vehicle.inspection_expiration_date
                        ? new Date(documents.vehicle.inspection_expiration_date).toLocaleDateString()
                        : "-"}
                      {isExpired(documents.vehicle.inspection_expiration_date) && (
                        <AlertTriangle className="inline w-4 h-4 ml-1 text-red-600" />
                      )}
                      {isExpiringSoon(documents.vehicle.inspection_expiration_date) && (
                        <AlertTriangle className="inline w-4 h-4 ml-1 text-yellow-600" />
                      )}
                    </span>
                  </div>
                  {documents.vehicle.approval_status === "rejected" && documents.vehicle.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                      却下理由: {documents.vehicle.rejection_reason}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">まだ申請されていません</p>
              )}
              <div className="mt-4 flex justify-end">
                <button className="text-green-600 text-sm font-medium flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  詳細を見る
                </button>
              </div>
            </div>

            {/* 任意保険証 */}
            <div
              onClick={() => setSelectedDoc("insurance")}
              className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all ${
                selectedDoc === "insurance" ? "ring-2 ring-purple-500" : "hover:shadow-lg"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-10 w-10 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">任意保険証</h3>
                </div>
                {getStatusBadge(documents?.insurance?.approval_status)}
              </div>
              {documents?.insurance ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">証券番号:</span>
                    <span className="font-medium">{documents.insurance.policy_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">保険期間:</span>
                    <span className={`font-medium ${
                      isExpired(documents.insurance.coverage_end_date) ? "text-red-600" :
                      isExpiringSoon(documents.insurance.coverage_end_date) ? "text-yellow-600" : ""
                    }`}>
                      {documents.insurance.coverage_end_date
                        ? new Date(documents.insurance.coverage_end_date).toLocaleDateString()
                        : "-"}
                      まで
                      {isExpired(documents.insurance.coverage_end_date) && (
                        <AlertTriangle className="inline w-4 h-4 ml-1 text-red-600" />
                      )}
                      {isExpiringSoon(documents.insurance.coverage_end_date) && (
                        <AlertTriangle className="inline w-4 h-4 ml-1 text-yellow-600" />
                      )}
                    </span>
                  </div>
                  {documents.insurance.approval_status === "rejected" && documents.insurance.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                      却下理由: {documents.insurance.rejection_reason}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">まだ申請されていません</p>
              )}
              <div className="mt-4 flex justify-end">
                <button className="text-purple-600 text-sm font-medium flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  詳細を見る
                </button>
              </div>
            </div>
          </div>

          {/* 画像プレビュー */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-800 px-4 py-3">
              <h3 className="text-white font-medium">
                {selectedDoc === "license" && "運転免許証"}
                {selectedDoc === "vehicle" && "車検証"}
                {selectedDoc === "insurance" && "任意保険証"}
                {!selectedDoc && "書類プレビュー"}
              </h3>
            </div>
            <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
              {selectedDoc && documents?.[selectedDoc]?.image_url ? (
                <img
                  src={`/api/files/${documents[selectedDoc]?.image_url}`}
                  alt="書類画像"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <FileText className="h-16 w-16 mx-auto mb-2" />
                  <p>
                    {selectedDoc
                      ? "画像がアップロードされていません"
                      : "左の書類を選択してください"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 操作ボタン */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            ダッシュボードに戻る
          </Link>
          {selectedDoc && !documents?.[selectedDoc] && (
            <Link
              href={`/dashboard/${selectedDoc}/new`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              申請する
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
