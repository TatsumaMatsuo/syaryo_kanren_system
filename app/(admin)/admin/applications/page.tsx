"use client";

import { useState, useEffect, useCallback } from "react";
import { ApplicationOverview } from "@/types";
import { CheckCircle, XCircle, Clock, FileText, Car, Shield } from "lucide-react";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [selectedApp, setSelectedApp] = useState<ApplicationOverview | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/applications/overview?filter=${filter}`);
      const data = await response.json();

      if (data.success) {
        setApplications(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
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
      await Promise.all([
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

      alert("申請を承認しました");
      fetchApplications();
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("承認に失敗しました");
    }
  };

  const handleReject = (app: ApplicationOverview) => {
    setSelectedApp(app);
    setShowRejectModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">申請管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            マイカー通勤申請の承認・却下を行います
          </p>
        </div>
      </header>

      {/* フィルター */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 却下モーダル */}
      {showRejectModal && selectedApp && (
        <RejectModal
          application={selectedApp}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedApp(null);
          }}
          onReject={() => {
            fetchApplications();
            setShowRejectModal(false);
            setSelectedApp(null);
          }}
        />
      )}
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

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("却下理由を入力してください");
      return;
    }

    setLoading(true);
    try {
      await Promise.all([
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

      alert("申請を却下しました");
      onReject();
    } catch (error) {
      console.error("Failed to reject:", error);
      alert("却下に失敗しました");
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
