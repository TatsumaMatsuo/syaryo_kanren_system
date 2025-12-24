"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Car, Shield, CheckCircle, Clock, XCircle, Search } from "lucide-react";

interface DocumentStatus {
  status: string;
  submitted: boolean;
}

interface ApplicationsState {
  license: DocumentStatus;
  vehicle: DocumentStatus;
  insurance: DocumentStatus;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [applications, setApplications] = useState<ApplicationsState>({
    license: { status: "pending", submitted: false },
    vehicle: { status: "pending", submitted: false },
    insurance: { status: "pending", submitted: false },
  });
  const [loading, setLoading] = useState(true);

  // 書類データを取得
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("/api/my-documents");
        const data = await response.json();

        if (data.success && data.data) {
          setApplications({
            license: {
              status: data.data.license?.approval_status || "pending",
              submitted: !!data.data.license,
            },
            vehicle: {
              status: data.data.vehicle?.approval_status || "pending",
              submitted: !!data.data.vehicle,
            },
            insurance: {
              status: data.data.insurance?.approval_status || "pending",
              submitted: !!data.data.insurance,
            },
          });
        }
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchDocuments();
    }
  }, [status]);

  // 未認証の場合はログインページにリダイレクト
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

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

  const user = {
    name: session.user.name || "ゲスト",
    employee_id: (session.user as any).id || session.user.email || "N/A",
  };

  const getStatusBadge = (status: string, submitted: boolean) => {
    if (!submitted) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                マイカー通勤申請ダッシュボード
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {user.name}さん（社員ID: {user.employee_id}）
              </p>
            </div>
            <Link
              href="/dashboard/documents"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search className="w-4 h-4 mr-2" />
              書類照会
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 申請カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 免許証 */}
          <Link href="/dashboard/license/new">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6">
              <div className="flex items-center justify-between mb-4">
                <FileText className="h-12 w-12 text-blue-600" />
                {getStatusBadge(applications.license.status, applications.license.submitted)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">免許証</h3>
              <p className="text-sm text-gray-600">
                運転免許証の情報を登録してください
              </p>
              <div className="mt-4 text-blue-600 text-sm font-medium">
                {applications.license.submitted ? "詳細を見る →" : "申請する →"}
              </div>
            </div>
          </Link>

          {/* 車検証 */}
          <Link href="/dashboard/vehicle/new">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6">
              <div className="flex items-center justify-between mb-4">
                <Car className="h-12 w-12 text-green-600" />
                {getStatusBadge(applications.vehicle.status, applications.vehicle.submitted)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">車検証</h3>
              <p className="text-sm text-gray-600">
                車検証の情報を登録してください
              </p>
              <div className="mt-4 text-green-600 text-sm font-medium">
                {applications.vehicle.submitted ? "詳細を見る →" : "申請する →"}
              </div>
            </div>
          </Link>

          {/* 任意保険 */}
          <Link href="/dashboard/insurance/new">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6">
              <div className="flex items-center justify-between mb-4">
                <Shield className="h-12 w-12 text-purple-600" />
                {getStatusBadge(applications.insurance.status, applications.insurance.submitted)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">任意保険証</h3>
              <p className="text-sm text-gray-600">
                任意保険証の情報を登録してください
              </p>
              <div className="mt-4 text-purple-600 text-sm font-medium">
                {applications.insurance.submitted ? "詳細を見る →" : "申請する →"}
              </div>
            </div>
          </Link>
        </div>

        {/* お知らせ */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                マイカー通勤を許可するには、免許証・車検証・任意保険証の3つすべてが承認される必要があります。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
