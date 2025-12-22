"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insurancePolicySchema,
  InsurancePolicyFormData,
} from "@/lib/validations/application";
import { FileUpload } from "./file-upload";

interface InsurancePolicyFormProps {
  onSubmit: (data: InsurancePolicyFormData) => Promise<void>;
  isLoading?: boolean;
}

export function InsurancePolicyForm({ onSubmit, isLoading = false }: InsurancePolicyFormProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<InsurancePolicyFormData>({
    resolver: zodResolver(insurancePolicySchema),
  });

  const handleFileChange = (file: File | null) => {
    setUploadedFile(file);
    setValue("image_file", file);
  };

  const onFormSubmit = async (data: InsurancePolicyFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">任意保険証情報</h2>

        {/* 任意保険証画像アップロード */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            任意保険証画像 <span className="text-red-500">*</span>
          </label>
          <FileUpload onFileChange={handleFileChange} />
          {errors.image_file && (
            <p className="mt-1 text-sm text-red-600">{errors.image_file.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 保険証券番号 */}
          <div>
            <label htmlFor="policy_number" className="block text-sm font-medium text-gray-700">
              保険証券番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="policy_number"
              {...register("policy_number")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-4 py-2 border"
              placeholder="例: ABC-123456789"
            />
            {errors.policy_number && (
              <p className="mt-1 text-sm text-red-600">{errors.policy_number.message}</p>
            )}
          </div>

          {/* 保険会社名 */}
          <div>
            <label
              htmlFor="insurance_company"
              className="block text-sm font-medium text-gray-700"
            >
              保険会社名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="insurance_company"
              {...register("insurance_company")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-4 py-2 border"
              placeholder="例: 東京海上日動火災保険"
            />
            {errors.insurance_company && (
              <p className="mt-1 text-sm text-red-600">{errors.insurance_company.message}</p>
            )}
          </div>

          {/* 保険種類 */}
          <div>
            <label htmlFor="policy_type" className="block text-sm font-medium text-gray-700">
              保険種類 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="policy_type"
              {...register("policy_type")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-4 py-2 border"
              placeholder="例: 対人・対物・車両保険"
            />
            {errors.policy_type && (
              <p className="mt-1 text-sm text-red-600">{errors.policy_type.message}</p>
            )}
          </div>

          {/* 補償金額 */}
          <div>
            <label htmlFor="insured_amount" className="block text-sm font-medium text-gray-700">
              補償金額（円）
            </label>
            <input
              type="number"
              id="insured_amount"
              {...register("insured_amount", {
                setValueAs: (value) => (value === "" ? null : Number(value)),
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-4 py-2 border"
              placeholder="例: 10000000"
            />
            {errors.insured_amount && (
              <p className="mt-1 text-sm text-red-600">{errors.insured_amount.message}</p>
            )}
          </div>

          {/* 補償開始日 */}
          <div>
            <label
              htmlFor="coverage_start_date"
              className="block text-sm font-medium text-gray-700"
            >
              補償開始日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="coverage_start_date"
              {...register("coverage_start_date", {
                setValueAs: (value) => (value ? new Date(value) : undefined),
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-4 py-2 border"
            />
            {errors.coverage_start_date && (
              <p className="mt-1 text-sm text-red-600">{errors.coverage_start_date.message}</p>
            )}
          </div>

          {/* 補償終了日 */}
          <div>
            <label htmlFor="coverage_end_date" className="block text-sm font-medium text-gray-700">
              補償終了日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="coverage_end_date"
              {...register("coverage_end_date", {
                setValueAs: (value) => (value ? new Date(value) : undefined),
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-4 py-2 border"
            />
            {errors.coverage_end_date && (
              <p className="mt-1 text-sm text-red-600">{errors.coverage_end_date.message}</p>
            )}
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "送信中..." : "申請する"}
          </button>
        </div>
      </div>
    </form>
  );
}
