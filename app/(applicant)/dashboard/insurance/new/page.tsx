"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InsurancePolicyForm } from "@/components/forms/insurance-policy-form";
import { InsurancePolicyFormData } from "@/lib/validations/application";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewInsurancePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: InsurancePolicyFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: ファイルアップロードの実装
      const imageUrl = "https://example.com/uploaded-insurance.jpg";

      // TODO: 実際のユーザーIDを取得
      const employeeId = "EMP001";

      // API呼び出し
      const response = await fetch("/api/applications/insurance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: employeeId,
          policy_number: data.policy_number,
          insurance_company: data.insurance_company,
          policy_type: data.policy_type,
          coverage_start_date: data.coverage_start_date.toISOString(),
          coverage_end_date: data.coverage_end_date.toISOString(),
          insured_amount: data.insured_amount,
          image_url: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("申請の送信に失敗しました");
      }

      router.push("/dashboard?success=insurance");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">任意保険証申請</h1>
          </div>
        </div>
      </header>

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

        <InsurancePolicyForm onSubmit={handleSubmit} isLoading={isLoading} />
      </main>
    </div>
  );
}
