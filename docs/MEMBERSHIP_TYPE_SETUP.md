# メンバーシップタイプ（membership_type）フィールド設定ガイド

## 概要

外部関連組織メンバーの認証・機能制限対応として、社員マスタテーブルに `membership_type` フィールドを追加しました。

## Lark Base テーブル設定

### 社員マスタテーブルへのフィールド追加

Lark Base の社員マスタテーブルに以下のフィールドを追加してください：

| フィールド名 | フィールドタイプ | 設定値 |
|-------------|-----------------|--------|
| `membership_type` | 単一選択（Single Select） | `internal`, `external`, `contractor` |

### フィールドの選択肢

1. **internal** - 内部社員
   - 社内の正社員・契約社員
   - 全機能にアクセス可能

2. **external** - 外部メンバー
   - 関連会社・パートナー企業のメンバー
   - 機能制限あり（自分のデータのみ閲覧可能）

3. **contractor** - 業務委託
   - 業務委託契約のメンバー
   - 機能制限あり（自分のデータのみ閲覧可能）

## 設定手順

### 1. Lark Base でフィールド追加

1. Lark Base の社員マスタテーブルを開く
2. 列を追加 → 「単一選択」を選択
3. フィールド名: `membership_type`
4. 選択肢を追加:
   - `internal`（デフォルト）
   - `external`
   - `contractor`

### 2. 既存データの更新

既存の社員データには `internal` を設定してください。

```
既存社員 → membership_type = "internal"
```

### 3. 外部メンバー登録時

外部メンバーを登録する際は、適切な `membership_type` を設定してください。

## 機能制限一覧

| 機能 | internal | external | contractor |
|------|----------|----------|------------|
| 自分の書類申請 | OK | OK | OK |
| 自分の書類閲覧 | OK | OK | OK |
| 全社員データ閲覧 | OK | NG | NG |
| データエクスポート | OK | NG | NG |
| 分析ダッシュボード | OK | NG | NG |
| 管理画面アクセス | OK | NG | NG |
| 他部署データ閲覧 | OK | NG | NG |

## システム側の対応

### 型定義

```typescript
// types/index.ts
export type MembershipType = "internal" | "external" | "contractor";

export interface Employee {
  // ...
  membership_type: MembershipType;
  // ...
}
```

### セッション情報

認証時にセッションに `membershipType` が含まれます：

```typescript
// session.user.membershipType
const session = await getServerSession();
const membershipType = session?.user?.membershipType; // "internal" | "external" | "contractor"
```

### サーバーサイド制限

```typescript
import { requireInternalMember, getMembershipRestrictions } from "@/lib/auth-utils";

// 内部社員のみアクセス可能なAPIエンドポイント
export async function GET(req: NextRequest) {
  const auth = await requireInternalMember();
  if (!auth.authorized) {
    return auth.response; // 403エラー
  }
  // ...
}

// 制限情報の取得
const restrictions = getMembershipRestrictions(membershipType);
if (!restrictions.canExportData) {
  // エクスポート機能を非表示
}
```

### クライアントサイド制限

```typescript
import { useMembershipType } from "@/hooks/useMembershipType";

function MyComponent() {
  const { membershipType, restrictions, isExternal } = useMembershipType();

  return (
    <div>
      {restrictions.canExportData && (
        <ExportButton />
      )}
      {isExternal && (
        <Alert>外部メンバーは一部機能が制限されています</Alert>
      )}
    </div>
  );
}
```

## デフォルト値

`membership_type` が設定されていない場合、システムは `"internal"` として扱います。
これにより、既存のデータとの後方互換性が保たれます。

## 関連ファイル

- `types/index.ts` - MembershipType 型定義
- `lib/lark-tables.ts` - EMPLOYEE_FIELDS.membership_type
- `services/employee.service.ts` - Employee取得時のマッピング
- `app/api/auth/[...nextauth]/route.ts` - 認証時のmembershipType取得
- `lib/auth-utils.ts` - 権限チェックユーティリティ
- `hooks/useMembershipType.ts` - クライアントサイドフック

## 注意事項

1. **後方互換性**: フィールドが未設定の場合は `internal` として扱われます
2. **管理者権限**: `membership_type` は管理者権限（role: admin）とは別の概念です
3. **通知**: 外部メンバーでも Open ID が登録されていればBot通知を受信可能です
