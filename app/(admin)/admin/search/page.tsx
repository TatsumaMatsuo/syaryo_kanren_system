"use client";

import { useState } from "react";
import { Search, FileText, Car, Shield, User, Calendar, CheckCircle, XCircle, Clock, Image as ImageIcon } from "lucide-react";
import { LarkUser, DriversLicense, VehicleRegistration, InsurancePolicy } from "@/types";

interface UserDocuments {
  license: DriversLicense | null;
  vehicle: VehicleRegistration | null;
  insurance: InsurancePolicy | null;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LarkUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LarkUser | null>(null);
  const [documents, setDocuments] = useState<UserDocuments | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // ユーザー検索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("検索キーワードを入力してください");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/lark/users/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
        if (data.data.length === 0) {
          alert("ユーザーが見つかりませんでした");
        }
      } else {
        alert("検索に失敗しました");
      }
    } catch (error) {
      console.error("Failed to search users:", error);
      alert("検索中にエラーが発生しました");
    } finally {
      setSearching(false);
    }
  };

  // ユーザー選択して書類取得
  const handleSelectUser = async (user: LarkUser) => {
    setSelectedUser(user);
    setDocuments(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/search/user-documents?employee_id=${encodeURIComponent(user.user_id || user.open_id)}`);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.data);
      } else {
        alert("書類の取得に失敗しました");
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      alert("書類の取得中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // ステータスバッジ
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            承認済
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            却下
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            承認待ち
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            不明
          </span>
        );
    }
  };

  return (
    <div className="p-8">
      {/* ページヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ユーザー書類照会</h1>
        <p className="mt-1 text-sm text-gray-600">
          ユーザーを検索して最新の書類を確認できます
        </p>
      </div>

      {/* ユーザー検索 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">ユーザー検索</h2>
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 border rounded-lg px-4 py-2"
            placeholder="名前、メールアドレス、または社員IDで検索..."
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {searching ? "検索中..." : "検索"}
          </button>
        </div>

        {/* 検索結果 */}
        {searchResults.length > 0 && (
          <div className="mt-4 border rounded-lg max-h-60 overflow-y-auto">
            <div className="divide-y">
              {searchResults.map((user) => (
                <div
                  key={user.open_id}
                  onClick={() => handleSelectUser(user)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUser?.open_id === user.open_id
                      ? "bg-blue-50 border-l-4 border-blue-600"
                      : ""
                  }`}
                >
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 選択されたユーザーの書類 */}
      {selectedUser && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">書類を読み込み中...</p>
            </div>
          ) : documents ? (
            <div className="space-y-6">
              {/* 運転免許証 */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">運転免許証</h3>
                  </div>
                  {documents.license && getStatusBadge(documents.license.approval_status)}
                </div>

                {documents.license ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="space-y-2 text-sm">
                        <div className="flex">
                          <span className="text-gray-500 w-32">免許証番号:</span>
                          <span className="text-gray-900 font-medium">{documents.license.license_number}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">種別:</span>
                          <span className="text-gray-900">{documents.license.license_type}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">交付日:</span>
                          <span className="text-gray-900">
                            {new Date(documents.license.issue_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">有効期限:</span>
                          <span className="text-gray-900 font-medium">
                            {new Date(documents.license.expiration_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {documents.license.image_url && (
                      <div>
                        <button
                          onClick={() => setSelectedImage(documents.license!.image_url)}
                          className="relative w-full h-40 border rounded-lg overflow-hidden hover:opacity-75 transition-opacity"
                        >
                          <img
                            src={documents.license.image_url}
                            alt="免許証"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
                            <ImageIcon className="w-8 h-8 text-white opacity-0 hover:opacity-100" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">登録されていません</p>
                )}
              </div>

              {/* 車検証 */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Car className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">車検証</h3>
                  </div>
                  {documents.vehicle && getStatusBadge(documents.vehicle.approval_status)}
                </div>

                {documents.vehicle ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="space-y-2 text-sm">
                        <div className="flex">
                          <span className="text-gray-500 w-32">車両番号:</span>
                          <span className="text-gray-900 font-medium">{documents.vehicle.vehicle_number}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">車種:</span>
                          <span className="text-gray-900">{documents.vehicle.vehicle_type}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">メーカー:</span>
                          <span className="text-gray-900">{documents.vehicle.manufacturer}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">型式:</span>
                          <span className="text-gray-900">{documents.vehicle.model_name}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">車検有効期限:</span>
                          <span className="text-gray-900 font-medium">
                            {new Date(documents.vehicle.inspection_expiration_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {documents.vehicle.image_url && (
                      <div>
                        <button
                          onClick={() => setSelectedImage(documents.vehicle!.image_url)}
                          className="relative w-full h-40 border rounded-lg overflow-hidden hover:opacity-75 transition-opacity"
                        >
                          <img
                            src={documents.vehicle.image_url}
                            alt="車検証"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
                            <ImageIcon className="w-8 h-8 text-white opacity-0 hover:opacity-100" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">登録されていません</p>
                )}
              </div>

              {/* 任意保険証 */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">任意保険証</h3>
                  </div>
                  {documents.insurance && getStatusBadge(documents.insurance.approval_status)}
                </div>

                {documents.insurance ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="space-y-2 text-sm">
                        <div className="flex">
                          <span className="text-gray-500 w-32">証券番号:</span>
                          <span className="text-gray-900 font-medium">{documents.insurance.policy_number}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">保険会社:</span>
                          <span className="text-gray-900">{documents.insurance.insurance_company}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">保険種別:</span>
                          <span className="text-gray-900">{documents.insurance.policy_type}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">保障開始日:</span>
                          <span className="text-gray-900">
                            {new Date(documents.insurance.coverage_start_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-500 w-32">保障終了日:</span>
                          <span className="text-gray-900 font-medium">
                            {new Date(documents.insurance.coverage_end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {documents.insurance.image_url && (
                      <div>
                        <button
                          onClick={() => setSelectedImage(documents.insurance!.image_url)}
                          className="relative w-full h-40 border rounded-lg overflow-hidden hover:opacity-75 transition-opacity"
                        >
                          <img
                            src={documents.insurance.image_url}
                            alt="保険証"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
                            <ImageIcon className="w-8 h-8 text-white opacity-0 hover:opacity-100" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">登録されていません</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 画像モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-screen p-4">
            <img
              src={selectedImage}
              alt="書類画像"
              className="max-w-full max-h-screen object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
