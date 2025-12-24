"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DriversLicenseForm } from "@/components/forms/drivers-license-form";
import { DriversLicenseFormData } from "@/lib/validations/application";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewLicensePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 未認証の場合はログインページにリダイレクト
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const handleSubmit = async (data: DriversLicenseFormData) => {
    if (!session || !session.user) {
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

      // セッションからユーザーID（メールアドレス）を取得
      const employeeId = session.user.email || "unknown";

      // 2. 申請データを送信
      const response = await fetch("/api/applications/licenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: employeeId,
          license_number: data.license_number,
          license_type: data.license_type,
          issue_date: data.issue_date.toISOString(),
          expiration_date: data.expiration_date.toISOString(),
          image_url: fileKey, // file_keyをimage_urlとして保存
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "申請の送信に失敗しました");
      }

      // 成功時はダッシュボードにリダイレクト
      router.push("/dashboard?success=license");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-900">免許証申請</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <DriversLicenseForm onSubmit={handleSubmit} isLoading={isLoading} />
      </main>
    </div>
  );
}
