# 管理者承認画面 実装ガイド

## 📝 実装概要

管理者が社員のマイカー通勤申請（免許証・車検証・任意保険証）を一括で承認または却下できる画面を実装しました。

## 🎯 実装内容

### 1. 認証機能の統合

**ファイル**: `app/(admin)/admin/applications/page.tsx`

#### セッション管理
```typescript
const { data: session, status } = useSession();
const router = useRouter();

// 未認証の場合はログインページにリダイレクト
useEffect(() => {
  if (status === "unauthenticated") {
    router.push("/auth/signin");
  }
}, [status, router]);
```

#### ローディング状態
```typescript
if (status === "loading") {
  return <LoadingSpinner />;
}

if (!session || !session.user) {
  return null; // リダイレクト中
}
```

### 2. トースト通知システム

**新規ファイル**: `components/ui/toast.tsx`

#### 特徴
- **4種類の通知タイプ**: success, error, info, warning
- **自動消去**: デフォルト3秒後に自動で消える
- **スライドインアニメーション**: 右からスライドして表示
- **カスタムフック**: `useToast()` で簡単に使用可能

#### 使用方法
```typescript
const toast = useToast();

// 成功通知
toast.success("申請を承認しました");

// エラー通知
toast.error("承認に失敗しました");

// 情報通知
toast.info("処理を開始しました");

// 警告通知
toast.warning("確認してください");
```

### 3. 申請一覧の取得と表示

#### データフェッチング
```typescript
const fetchApplications = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch(`/api/applications/overview?filter=${filter}`);
    const data = await response.json();

    if (data.success) {
      setApplications(data.data || []);
    } else {
      setError(data.error || "申請の取得に失敗しました");
    }
  } catch (error) {
    setError("申請の取得に失敗しました");
  } finally {
    setLoading(false);
  }
}, [filter]);
```

#### フィルター機能
- **承認待ち**: `filter=pending`
- **承認済み**: `filter=approved`
- **すべて**: `filter=all`

### 4. 承認機能

#### 処理フロー
1. ユーザーが「承認」ボタンをクリック
2. 確認ダイアログを表示
3. 免許証・車検証・任意保険証の3つすべてを並列で承認
4. すべて成功した場合、成功トーストを表示
5. 一覧を再取得して最新状態を表示

#### 実装
```typescript
const handleApprove = async (app: ApplicationOverview) => {
  if (!confirm("この申請を承認しますか？")) return;

  try {
    const results = await Promise.all([
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

    const allSuccess = results.every(r => r.ok);
    if (allSuccess) {
      toast.success(`${app.employee.employee_name}さんの申請を承認しました`);
      fetchApplications();
    }
  } catch (error) {
    toast.error("承認に失敗しました。もう一度お試しください。");
  }
};
```

### 5. 却下機能

#### 処理フロー
1. ユーザーが「却下」ボタンをクリック
2. モーダルダイアログを表示
3. 却下理由を入力（必須）
4. 免許証・車検証・任意保険証の3つすべてを並列で却下
5. すべて成功した場合、成功トーストを表示
6. モーダルを閉じて一覧を再取得

#### 却下モーダル
```typescript
function RejectModal({ application, onClose, onReject }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("却下理由を入力してください");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all([
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

      const allSuccess = results.every(r => r.ok);
      if (allSuccess) {
        onReject();
      }
    } catch (err) {
      setError("却下に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  // モーダルUI...
}
```

## 🔌 API エンドポイント

### 1. 申請一覧取得

**エンドポイント**: `GET /api/applications/overview`

**クエリパラメータ**:
- `filter`: "pending" | "approved" | "all" (デフォルト: "all")
- `employeeId`: 社員ID (オプション)

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "employee": {
        "employee_id": "ou_xxxxx",
        "employee_name": "山田太郎",
        "email": "yamada@example.com",
        "department": "営業部"
      },
      "license": {
        "id": "rec_xxxxx",
        "license_number": "123456789012",
        "expiration_date": "2025-12-31",
        "approval_status": "pending"
      },
      "vehicle": {
        "id": "rec_yyyyy",
        "vehicle_number": "横浜123あ4567",
        "inspection_expiration_date": "2025-06-30",
        "approval_status": "pending"
      },
      "insurance": {
        "id": "rec_zzzzz",
        "policy_number": "POL-12345",
        "coverage_end_date": "2025-12-31",
        "approval_status": "pending"
      }
    }
  ],
  "count": 1
}
```

### 2. 承認

**エンドポイント**: `POST /api/approvals/:id`

**リクエストボディ**:
```json
{
  "type": "license" | "vehicle" | "insurance",
  "action": "approve"
}
```

**レスポンス**:
```json
{
  "success": true,
  "message": "Application approved successfully"
}
```

### 3. 却下

**エンドポイント**: `POST /api/approvals/:id/reject`

**リクエストボディ**:
```json
{
  "type": "license" | "vehicle" | "insurance",
  "reason": "却下理由"
}
```

**レスポンス**:
```json
{
  "success": true,
  "message": "Application rejected successfully"
}
```

## 🎨 UI/UX 機能

### 1. ステータスバッジ

各申請のステータスを視覚的に表示:

- **審査中** (pending): 黄色バッジ + 時計アイコン
- **承認済み** (approved): 緑色バッジ + チェックアイコン
- **却下** (rejected): 赤色バッジ + ×アイコン

### 2. フィルター機能

- ボタンで簡単に絞り込み
- アクティブなフィルターは色が変わる
- フィルター変更時に自動で一覧を再取得

### 3. レスポンシブデザイン

- **モバイル**: 1列表示
- **タブレット**: 2列表示
- **デスクトップ**: 3列表示（免許証・車検証・任意保険証）

### 4. エラーハンドリング

- API エラー時に赤いバナーで表示
- モーダル内のエラーはモーダル内に表示
- 成功/失敗はトースト通知で表示

## 🔐 権限管理

### 管理者権限チェック

**サーバーサイド** (`/api/approvals/*`):
```typescript
const authCheck = await requireAdmin();
if (!authCheck.authorized) {
  return authCheck.response; // 401 or 403
}
```

**クライアントサイド** (`page.tsx`):
```typescript
useEffect(() => {
  if (status === "unauthenticated") {
    router.push("/auth/signin");
  }
}, [status, router]);
```

## 🧪 テスト方法

### 1. 管理者としてログイン

```
http://localhost:3001/auth/signin
```

Larkアカウントでログインし、Lark Baseの`user_permissions`テーブルでroleを`admin`に設定。

### 2. 管理者画面にアクセス

```
http://localhost:3001/admin/applications
```

### 3. フィルター機能のテスト

1. 「承認待ち」ボタンをクリック → pending状態の申請のみ表示
2. 「承認済み」ボタンをクリック → approved状態の申請のみ表示
3. 「すべて」ボタンをクリック → すべての申請を表示

### 4. 承認機能のテスト

1. 申請カードの「承認」ボタンをクリック
2. 確認ダイアログで「OK」をクリック
3. 緑色のトースト通知が表示される
4. 一覧が更新され、ステータスが「承認済み」になる

### 5. 却下機能のテスト

1. 申請カードの「却下」ボタンをクリック
2. モーダルが表示される
3. 却下理由を入力
4. 「却下する」ボタンをクリック
5. 緑色のトースト通知が表示される
6. モーダルが閉じ、一覧が更新される

## ⚠️ 注意事項

### 現在の制限事項

1. **一括承認/却下**: 3つの申請を個別に承認/却下できない（常に3つまとめて処理）
2. **通知機能**: 承認/却下時にLark通知は未実装
3. ~~**ファイル表示**: アップロードされた画像の表示機能は未実装~~ ✅ **実装済み** (2024-12-24)
4. **承認履歴**: 誰が承認/却下したかの履歴記録は未実装

### 将来の改善案

1. **個別承認**: 免許証・車検証・任意保険証を個別に承認/却下
2. ~~**画像プレビュー**: モーダルで画像を確認してから承認/却下~~ ✅ **実装済み** ([FILE_PREVIEW_IMPLEMENTATION.md](./FILE_PREVIEW_IMPLEMENTATION.md) 参照)
3. **一括操作**: 複数の申請を選択して一括承認/却下
4. **フィルター拡張**: 部署別、期限別などの詳細フィルター
5. **並び替え**: 申請日順、期限順などのソート機能
6. **通知統合**: 承認/却下時にLark Messengerで通知
7. **画像の拡大縮小**: PDFプレビュー、ズーム機能など（FILE_PREVIEW_IMPLEMENTATION.md 参照）

## 📊 実装状況

- ✅ 認証機能の統合
- ✅ 申請一覧の取得と表示
- ✅ フィルター機能
- ✅ 承認機能
- ✅ 却下機能（理由入力）
- ✅ トースト通知
- ✅ エラーハンドリング
- ✅ レスポンシブデザイン
- ✅ 画像プレビュー機能 (2024-12-24追加)
- ⬜ Lark通知連携
- ⬜ 承認履歴の記録

---

実装日: 2024-12-24
