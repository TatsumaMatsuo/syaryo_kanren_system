# データベーススキーマ設計書

## Lark Base テーブル設計

### 1. 免許証テーブル (drivers_licenses)

| カラム名 | データ型 | 必須 | 説明 |
|---------|---------|------|------|
| id | TEXT | ○ | 主キー（UUID） |
| employee_id | TEXT | ○ | 社員ID（外部キー） |
| license_number | TEXT | ○ | 免許証番号 |
| license_type | TEXT | ○ | 免許種類（普通、準中型、中型等） |
| issue_date | DATE | ○ | 発行日 |
| expiration_date | DATE | ○ | 有効期限 |
| image_url | TEXT | ○ | アップロード画像URL |
| status | TEXT | ○ | ステータス（仮/本） |
| approval_status | TEXT | ○ | 承認状態（pending/approved/rejected） |
| rejection_reason | TEXT |  | 却下理由 |
| created_at | DATETIME | ○ | 作成日時 |
| updated_at | DATETIME | ○ | 更新日時 |
| deleted_flag | BOOLEAN | ○ | 削除フラグ（デフォルト: false） |
| deleted_at | DATETIME |  | 削除日時 |

**インデックス:**
- employee_id
- expiration_date（有効期限検索用）
- status
- deleted_flag

---

### 2. 車検証テーブル (vehicle_registrations)

| カラム名 | データ型 | 必須 | 説明 |
|---------|---------|------|------|
| id | TEXT | ○ | 主キー（UUID） |
| employee_id | TEXT | ○ | 社員ID（外部キー） |
| vehicle_number | TEXT | ○ | 車両番号（ナンバープレート） |
| vehicle_type | TEXT | ○ | 車種 |
| manufacturer | TEXT | ○ | メーカー |
| model_name | TEXT | ○ | 車名 |
| inspection_expiration_date | DATE | ○ | 車検有効期限 |
| owner_name | TEXT | ○ | 所有者名 |
| image_url | TEXT | ○ | アップロード画像URL |
| status | TEXT | ○ | ステータス（仮/本） |
| approval_status | TEXT | ○ | 承認状態（pending/approved/rejected） |
| rejection_reason | TEXT |  | 却下理由 |
| created_at | DATETIME | ○ | 作成日時 |
| updated_at | DATETIME | ○ | 更新日時 |
| deleted_flag | BOOLEAN | ○ | 削除フラグ（デフォルト: false） |
| deleted_at | DATETIME |  | 削除日時 |

**インデックス:**
- employee_id
- inspection_expiration_date（有効期限検索用）
- vehicle_number
- status
- deleted_flag

---

### 3. 任意保険証テーブル (insurance_policies)

| カラム名 | データ型 | 必須 | 説明 |
|---------|---------|------|------|
| id | TEXT | ○ | 主キー（UUID） |
| employee_id | TEXT | ○ | 社員ID（外部キー） |
| policy_number | TEXT | ○ | 保険証券番号 |
| insurance_company | TEXT | ○ | 保険会社名 |
| policy_type | TEXT | ○ | 保険種類（対人/対物/車両等） |
| coverage_start_date | DATE | ○ | 補償開始日 |
| coverage_end_date | DATE | ○ | 補償終了日（有効期限） |
| insured_amount | DECIMAL |  | 補償金額 |
| image_url | TEXT | ○ | アップロード画像URL |
| status | TEXT | ○ | ステータス（仮/本） |
| approval_status | TEXT | ○ | 承認状態（pending/approved/rejected） |
| rejection_reason | TEXT |  | 却下理由 |
| created_at | DATETIME | ○ | 作成日時 |
| updated_at | DATETIME | ○ | 更新日時 |
| deleted_flag | BOOLEAN | ○ | 削除フラグ（デフォルト: false） |
| deleted_at | DATETIME |  | 削除日時 |

**インデックス:**
- employee_id
- coverage_end_date（有効期限検索用）
- policy_number
- status
- deleted_flag

---

### 4. 社員マスタテーブル (employees)

| カラム名 | データ型 | 必須 | 説明 |
|---------|---------|------|------|
| employee_id | TEXT | ○ | 社員ID（主キー） |
| employee_name | TEXT | ○ | 社員名 |
| email | TEXT | ○ | メールアドレス |
| department | TEXT |  | 所属部署 |
| role | TEXT | ○ | 役割（applicant/admin） |
| employment_status | TEXT | ○ | 雇用状態（active/resigned） |
| hire_date | DATE | ○ | 入社日 |
| resignation_date | DATE |  | 退職日 |
| created_at | DATETIME | ○ | 作成日時 |
| updated_at | DATETIME | ○ | 更新日時 |

**インデックス:**
- employee_id
- email
- employment_status

---

## 統合ビュー (管理者画面用)

### application_overview_view

3つのテーブルを社員IDで内部結合した統合ビュー

```sql
SELECT
    e.employee_id,
    e.employee_name,
    e.department,

    -- 免許証情報
    dl.license_number,
    dl.expiration_date as license_expiration,
    dl.status as license_status,
    dl.approval_status as license_approval,
    dl.image_url as license_image,

    -- 車検証情報
    vr.vehicle_number,
    vr.inspection_expiration_date as vehicle_inspection_expiration,
    vr.status as vehicle_status,
    vr.approval_status as vehicle_approval,
    vr.image_url as vehicle_image,

    -- 任意保険情報
    ip.policy_number,
    ip.coverage_end_date as insurance_expiration,
    ip.status as insurance_status,
    ip.approval_status as insurance_approval,
    ip.image_url as insurance_image

FROM employees e
INNER JOIN drivers_licenses dl ON e.employee_id = dl.employee_id
INNER JOIN vehicle_registrations vr ON e.employee_id = vr.employee_id
INNER JOIN insurance_policies ip ON e.employee_id = ip.employee_id

WHERE
    dl.deleted_flag = false
    AND vr.deleted_flag = false
    AND ip.deleted_flag = false
    AND e.employment_status = 'active'
```

---

## ステータス定義

### status（仮/本）
- `temporary`: 仮（承認待ち、または却下された状態）
- `approved`: 本（承認済み）

### approval_status（承認状態）
- `pending`: 承認待ち
- `approved`: 承認済み
- `rejected`: 却下

---

## 有効期限アラート抽出条件

### 1週間前アラート対象

```sql
-- 免許証
SELECT * FROM drivers_licenses
WHERE deleted_flag = false
  AND status = 'approved'
  AND expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'

-- 車検証
SELECT * FROM vehicle_registrations
WHERE deleted_flag = false
  AND status = 'approved'
  AND inspection_expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'

-- 任意保険
SELECT * FROM insurance_policies
WHERE deleted_flag = false
  AND status = 'approved'
  AND coverage_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
```

### 期限切れアラート対象

```sql
-- 全テーブル共通条件
WHERE deleted_flag = false
  AND status = 'approved'
  AND [有効期限カラム] < CURRENT_DATE
```

---

## データライフサイクル

### 新規申請時
1. status = `temporary`
2. approval_status = `pending`
3. deleted_flag = `false`

### 承認時
1. status = `temporary` → `approved`
2. approval_status = `pending` → `approved`

### 却下時
1. status = `temporary` (変更なし)
2. approval_status = `pending` → `rejected`
3. rejection_reason に理由を記録

### 退職時
1. deleted_flag = `true`
2. deleted_at = 現在日時
3. employees.employment_status = `resigned`

---

## Lark Base 実装時の注意点

1. **ファイルアップロード**
   - Lark Baseのファイルフィールドを使用
   - URLで参照可能な形式で保存

2. **通知連携**
   - Lark Messengerとの連携APIを使用
   - Webhookでリアルタイム通知

3. **権限管理**
   - Lark Baseのアクセス制御機能を活用
   - 申請者は自分のデータのみ編集可能
   - 管理者は全データ閲覧・編集可能

4. **バックアップ**
   - Lark Baseの自動バックアップ機能を有効化
   - 定期的なエクスポート設定
