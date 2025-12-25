"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FileText,
  Download,
  Car,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
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

export default function PermitsPage() {
  const { data: session } = useSession();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPermits() {
      if (!session?.user?.email) return;

      try {
        const response = await fetch(
          `/api/permits?employeeId=${encodeURIComponent(session.user.email)}`
        );
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
    }

    fetchPermits();
  }, [session]);

  const handleDownload = async (permitId: string) => {
    window.open(`/api/permits/download/${permitId}`, "_blank");
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

  const validPermits = permits.filter((p) => p.status === "valid");
  const otherPermits = permits.filter((p) => p.status !== "valid");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">許可証一覧</h1>
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ダッシュボードに戻る
        </Link>
      </div>

      {permits.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">発行済みの許可証はありません</p>
          <p className="text-sm text-gray-500 mt-2">
            すべての書類が承認されると許可証が自動で発行されます
          </p>
        </div>
      ) : (
        <>
          {/* 有効な許可証 */}
          {validPermits.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                有効な許可証
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {validPermits.map((permit) => (
                  <div
                    key={permit.id}
                    className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Car className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {permit.vehicle_number}
                          </p>
                          <p className="text-sm text-gray-500">
                            {permit.vehicle_model}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(permit.status)}
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>有効期限: {formatDate(permit.expiration_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>発行日: {formatDate(permit.issue_date)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(permit.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      許可証をダウンロード
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 過去の許可証 */}
          {otherPermits.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                過去の許可証
              </h2>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                {otherPermits.map((permit) => (
                  <div
                    key={permit.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Car className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-700">
                          {permit.vehicle_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          有効期限: {formatDate(permit.expiration_date)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(permit.status)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
