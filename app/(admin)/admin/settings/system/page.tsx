"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings, Save, FileText, Car, Shield, Bell } from "lucide-react";

interface SystemSettings {
  license_expiry_warning_days: number;
  vehicle_expiry_warning_days: number;
  insurance_expiry_warning_days: number;
  admin_notification_after_days: number;
}

export default function SystemSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SystemSettings>({
    license_expiry_warning_days: 30,
    vehicle_expiry_warning_days: 30,
    insurance_expiry_warning_days: 30,
    admin_notification_after_days: 7,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchSettings();
    checkAdminPermission();
  }, [session]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminPermission = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch("/api/permissions");
      const data = await response.json();

      if (data.success && data.data) {
        // 現在のユーザーのメールアドレスで権限を確認
        const userEmail = session.user.email;
        const userPermission = data.data.find(
          (p: any) => p.user_email === userEmail
        );
        setIsAdmin(userPermission?.role === "admin");
      }
    } catch (error) {
      console.error("Failed to check permission:", error);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      alert("管理者のみ設定を変更できます");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("設定を保存しました");
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("設定の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof SystemSettings, value: number) => {
    if (!isAdmin) return;
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      {/* ページヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">システム設定</h1>
          <p className="mt-1 text-sm text-gray-600">
            有効期限通知と管理者通知の設定を管理します
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? "保存中..." : "設定を保存"}
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm text-yellow-700">
            この設定は閲覧専用です。変更するには管理者権限が必要です。
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* 有効期限警告設定 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Bell className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              有効期限警告通知
            </h2>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            書類の有効期限が切れる前に、ユーザーに通知を送信する日数を設定します
          </p>

          <div className="space-y-6">
            {/* 運転免許証 */}
            <div className="border rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">運転免許証</h3>
                    <p className="text-sm text-gray-500">
                      有効期限の何日前に通知するか
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-8 sm:ml-0">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.license_expiry_warning_days}
                    onChange={(e) =>
                      handleChange(
                        "license_expiry_warning_days",
                        parseInt(e.target.value, 10)
                      )
                    }
                    disabled={!isAdmin}
                    className="w-20 sm:w-24 border rounded-lg px-3 py-2 text-right disabled:bg-gray-100"
                  />
                  <span className="text-gray-700">日前</span>
                </div>
              </div>
            </div>

            {/* 車検証 */}
            <div className="border rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <Car className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">車検証</h3>
                    <p className="text-sm text-gray-500">
                      車検有効期限の何日前に通知するか
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-8 sm:ml-0">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.vehicle_expiry_warning_days}
                    onChange={(e) =>
                      handleChange(
                        "vehicle_expiry_warning_days",
                        parseInt(e.target.value, 10)
                      )
                    }
                    disabled={!isAdmin}
                    className="w-20 sm:w-24 border rounded-lg px-3 py-2 text-right disabled:bg-gray-100"
                  />
                  <span className="text-gray-700">日前</span>
                </div>
              </div>
            </div>

            {/* 任意保険証 */}
            <div className="border rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">任意保険証</h3>
                    <p className="text-sm text-gray-500">
                      保障終了日の何日前に通知するか
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-8 sm:ml-0">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.insurance_expiry_warning_days}
                    onChange={(e) =>
                      handleChange(
                        "insurance_expiry_warning_days",
                        parseInt(e.target.value, 10)
                      )
                    }
                    disabled={!isAdmin}
                    className="w-20 sm:w-24 border rounded-lg px-3 py-2 text-right disabled:bg-gray-100"
                  />
                  <span className="text-gray-700">日前</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 管理者通知設定 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Settings className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              管理者通知設定
            </h2>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            有効期限切れ後、管理者に通知を送信するまでの日数を設定します
          </p>

          <div className="border rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-medium text-gray-900">
                  管理者エスカレーション通知
                </h3>
                <p className="text-sm text-gray-500">
                  有効期限切れ後、何日経過したら管理者に通知するか
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-700 text-sm">期限切れ後</span>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={settings.admin_notification_after_days}
                  onChange={(e) =>
                    handleChange(
                      "admin_notification_after_days",
                      parseInt(e.target.value, 10)
                    )
                  }
                  disabled={!isAdmin}
                  className="w-20 sm:w-24 border rounded-lg px-3 py-2 text-right disabled:bg-gray-100"
                />
                <span className="text-gray-700 text-sm">日後</span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>例:</strong> 7日後に設定すると、有効期限が切れてから7日経過した時点で管理者に通知が送信されます。
            </p>
          </div>
        </div>

        {/* 設定の説明 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-3">設定について</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• ユーザーへの警告通知は、設定した日数前に自動的に送信されます</li>
            <li>
              • 管理者通知は、有効期限切れ後の設定日数経過時にエスカレーションとして送信されます
            </li>
            <li>• すべての設定は管理者権限を持つユーザーのみ変更可能です</li>
            <li>
              • 設定変更後は「設定を保存」ボタンをクリックして保存してください
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
