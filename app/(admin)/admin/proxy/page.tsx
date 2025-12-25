"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FileText,
  Car,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Plus,
  Award,
  UserPlus,
  ArrowLeft,
  User,
} from "lucide-react";

interface Employee {
  employee_id: string;
  employee_name: string;
  email?: string;
  department?: string;
}

interface DocumentData {
  id?: string;
  approval_status?: string;
}

interface MyDocuments {
  license: DocumentData | null;
  vehicles: DocumentData[];
  insurances: DocumentData[];
}

interface StatusSummary {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export default function ProxyApplicationPage() {
  const { data: session } = useSession();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [searching, setSearching] = useState(false);
  const [documents, setDocuments] = useState<MyDocuments>({
    license: null,
    vehicles: [],
    insurances: [],
  });
  const [loading, setLoading] = useState(false);

  // 社員検索
  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      alert("2文字以上で検索してください");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/lark/users/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        // LarkUser を Employee に変換
        const employees: Employee[] = data.data.map((user: any) => ({
          employee_id: user.user_id || user.open_id,
          employee_name: user.name,
          email: user.email,
        }));
        setSearchResults(employees);

        if (employees.length === 0) {
          alert("社員が見つかりませんでした");
        }
      } else {
        alert("検索に失敗しました");
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert("検索中にエラーが発生しました");
    } finally {
      setSearching(false);
    }
  };

  // 社員選択時に書類データを取得
  useEffect(() => {
    if (!selectedEmployee) return;

    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/my-documents?employee_id=${selectedEmployee.employee_id}`);
        const data = await response.json();

        if (data.success && data.data) {
          setDocuments({
            license: data.data.license || null,
            vehicles: data.data.vehicles || [],
            insurances: data.data.insurances || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [selectedEmployee]);

  // ステータス集計
  const getStatusSummary = (docs: DocumentData[]): StatusSummary => {
    return docs.reduce(
      (acc, doc) => {
        acc.total++;
        const status = doc.approval_status || "pending";
        if (status === "approved") acc.approved++;
        else if (status === "pending") acc.pending++;
        else if (status === "rejected") acc.rejected++;
        return acc;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0 }
    );
  };

  // 単一ドキュメントのステータスバッジ
  const getStatusBadge = (status: string | undefined, submitted: boolean) => {
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

  // 複数ドキュメントのサマリーバッジ
  const getMultiStatusBadge = (summary: StatusSummary) => {
    if (summary.total === 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          <Clock className="w-4 h-4 mr-1" />
          未申請
        </span>
      );
    }

    if (summary.approved === summary.total) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-1" />
          {summary.total}件承認済み
        </span>
      );
    }

    if (summary.rejected > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="w-4 h-4 mr-1" />
          {summary.rejected}件却下
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-4 h-4 mr-1" />
        {summary.pending}件審査中
      </span>
    );
  };

  // 社員未選択時: 検索画面
  if (!selectedEmployee) {
    return (
      <div className="p-4 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-7 h-7 text-cyan-600" />
            代理申請
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            代理で申請する社員を選択してください
          </p>
        </div>

        {/* 社員検索 */}
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">社員を検索</h2>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="社員名または社員IDで検索..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* 検索結果 */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
              {searchResults.map((employee) => (
                <div
                  key={employee.employee_id}
                  onClick={() => setSelectedEmployee(employee)}
                  className="p-4 hover:bg-cyan-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{employee.employee_name}</p>
                      <p className="text-sm text-gray-500">
                        ID: {employee.employee_id}
                        {employee.email && ` | ${employee.email}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 社員選択後: ダッシュボード
  const vehicleSummary = getStatusSummary(documents.vehicles);
  const insuranceSummary = getStatusSummary(documents.insurances);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                社員選択に戻る
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-7 h-7 text-cyan-600" />
                代理申請
              </h1>
              <div className="mt-2 flex items-center gap-2 bg-cyan-50 px-4 py-2 rounded-lg">
                <User className="w-5 h-5 text-cyan-600" />
                <span className="font-medium text-cyan-800">
                  {selectedEmployee.employee_name}
                </span>
                <span className="text-cyan-600 text-sm">
                  （社員ID: {selectedEmployee.employee_id}）
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/proxy/permits?employee_id=${selectedEmployee.employee_id}`}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Award className="w-4 h-4 mr-2" />
                許可証
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        ) : (
          <>
            {/* 申請カード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 免許証（1:1） */}
              <Link href={`/admin/proxy/license/new?employee_id=${selectedEmployee.employee_id}&employee_name=${encodeURIComponent(selectedEmployee.employee_name)}`}>
                <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6">
                  <div className="flex items-center justify-between mb-4">
                    <FileText className="h-12 w-12 text-blue-600" />
                    {getStatusBadge(documents.license?.approval_status, !!documents.license)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">免許証</h3>
                  <p className="text-xs text-gray-500 mb-2">1件まで登録可能</p>
                  <p className="text-sm text-gray-600">
                    運転免許証の情報を登録してください
                  </p>
                  <div className="mt-4 text-blue-600 text-sm font-medium">
                    {documents.license ? "詳細を見る →" : "申請する →"}
                  </div>
                </div>
              </Link>

              {/* 車検証（1:多） */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <Car className="h-12 w-12 text-green-600" />
                  {getMultiStatusBadge(vehicleSummary)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">車検証</h3>
                <p className="text-xs text-gray-500 mb-2">複数登録可能（現在{vehicleSummary.total}件）</p>
                <p className="text-sm text-gray-600 mb-4">
                  車検証の情報を登録してください
                </p>

                {vehicleSummary.total > 0 && (
                  <div className="mb-4 text-xs text-gray-500 space-y-1">
                    {vehicleSummary.approved > 0 && (
                      <div className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                        承認済み: {vehicleSummary.approved}件
                      </div>
                    )}
                    {vehicleSummary.pending > 0 && (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 text-yellow-500 mr-1" />
                        審査中: {vehicleSummary.pending}件
                      </div>
                    )}
                    {vehicleSummary.rejected > 0 && (
                      <div className="flex items-center">
                        <XCircle className="w-3 h-3 text-red-500 mr-1" />
                        却下: {vehicleSummary.rejected}件
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/admin/proxy/vehicle/new?employee_id=${selectedEmployee.employee_id}&employee_name=${encodeURIComponent(selectedEmployee.employee_name)}`}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    追加
                  </Link>
                </div>
              </div>

              {/* 任意保険（1:多） */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <Shield className="h-12 w-12 text-purple-600" />
                  {getMultiStatusBadge(insuranceSummary)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">任意保険証</h3>
                <p className="text-xs text-gray-500 mb-2">複数登録可能（現在{insuranceSummary.total}件）</p>
                <p className="text-sm text-gray-600 mb-4">
                  任意保険証の情報を登録してください
                </p>

                {insuranceSummary.total > 0 && (
                  <div className="mb-4 text-xs text-gray-500 space-y-1">
                    {insuranceSummary.approved > 0 && (
                      <div className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                        承認済み: {insuranceSummary.approved}件
                      </div>
                    )}
                    {insuranceSummary.pending > 0 && (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 text-yellow-500 mr-1" />
                        審査中: {insuranceSummary.pending}件
                      </div>
                    )}
                    {insuranceSummary.rejected > 0 && (
                      <div className="flex items-center">
                        <XCircle className="w-3 h-3 text-red-500 mr-1" />
                        却下: {insuranceSummary.rejected}件
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/admin/proxy/insurance/new?employee_id=${selectedEmployee.employee_id}&employee_name=${encodeURIComponent(selectedEmployee.employee_name)}`}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    追加
                  </Link>
                </div>
              </div>
            </div>

            {/* お知らせ */}
            <div className="mt-8 bg-cyan-50 border-l-4 border-cyan-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <UserPlus className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-cyan-800">
                    <strong>{selectedEmployee.employee_name}</strong> さんの代理として申請を行います。
                    登録されたデータは選択した社員のデータとして保存されます。
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
