export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          車両関連管理システム
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          マイカー通勤申請・車両情報管理
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            システム機能
          </h2>
          <ul className="text-left space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              免許証・車検証・任意保険証の申請管理
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              管理者による承認・却下処理
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              有効期限の自動通知機能
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              許可証の発行・管理
            </li>
          </ul>
          <div className="mt-8">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200">
              開発中...
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
