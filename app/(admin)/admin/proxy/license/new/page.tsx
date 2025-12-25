"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { DriversLicenseForm } from "@/components/forms/drivers-license-form";
import { DriversLicenseFormData } from "@/lib/validations/application";
import { ArrowLeft, UserPlus, User } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function ProxyLicenseContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const employeeId = searchParams.get("employee_id");
  const employeeName = searchParams.get("employee_name") || "不明";

  // パラメータがない場合は代理申請トップに戻す
  useEffect(() => {
    if (!employeeId) {
      router.push("/admin/proxy");
    }
  }, [employeeId, router]);

  const handleSubmit = async (data: DriversLicenseFormData) => {
    if (!session || !session.user || !employeeId) {
      setError("ログインしてください");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. ファイルをLarkにアップロード
      let fileKey = "";
      if (data.image_file) {
        const formData = new FormData();
        formData.append("file", data.image_file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "ファイルのアップロードに失敗しました");
        }

        const uploadResult = await uploadResponse.json();
        fileKey = uploadResult.file_key;
      }

      // 2. 申請データを送信（代理社員のIDを使用）
      const response = await fetch("/api/applications/licenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: employeeId, // 代理対象の社員ID
          license_number: data.license_number,
          license_type: data.license_type,
          issue_date: data.issue_date.toISOString(),
          expiration_date: data.expiration_date.toISOString(),
          image_url: fileKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "申請の送信に失敗しました");
      }

      // 成功時は代理申請ダッシュボードにリダイレクト
      alert("免許証を登録しました");
      router.push("/admin/proxy");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || !employeeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/proxy"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-cyan-600" />
                免許証申請（代理）
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-cyan-600" />
                <span className="text-cyan-700 font-medium">{decodeURIComponent(employeeName)}</span>
                <span className="text-gray-500">（ID: {employeeId}）</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 代理申請の注意書き */}
        <div className="mb-6 bg-cyan-50 border-l-4 border-cyan-400 p-4 rounded">
          <div className="flex">
            <UserPlus className="h-5 w-5 text-cyan-600 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm text-cyan-800">
                <strong>{decodeURIComponent(employeeName)}</strong> さんの代理として申請を行っています。
                登録データは選択した社員のデータとして保存されます。
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <DriversLicenseForm onSubmit={handleSubmit} isLoading={isLoading} />
      </main>
    </div>
  );
}

export default function ProxyLicensePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ProxyLicenseContent />
    </Suspense>
  );
}
