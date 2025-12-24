# 全テーブル フィールド設定ガイド

## 📋 目次

1. [車検証テーブル (vehicle_registrations)](#1-車検証テーブル-vehicle_registrations)
2. [任意保険証テーブル (insurance_policies)](#2-任意保険証テーブル-insurance_policies)
3. [社員マスタテーブル (employees)](#3-社員マスタテーブル-employees)
4. [検証スクリプト](#検証スクリプト)

---

## 1. 車検証テーブル (vehicle_registrations)

### テーブルID
`tblTvAk5LYrSk24y`

### 必須フィールド一覧（12個）

#### 基本情報フィールド

**1. vehicle_number (車両番号)**
- フィールド名: `vehicle_number`
- タイプ: テキスト
- 説明: 車両登録番号

**2. manufacturer (メーカー)**
- フィールド名: `manufacturer`
- タイプ: テキスト
- 説明: 自動車メーカー名

**3. model_name (車名)**
- フィールド名: `model_name`
- タイプ: テキスト
- 説明: 車種名

**4. owner_name (所有者名)**
- フィールド名: `owner_name`
- タイプ: テキスト
- 説明: 車両所有者の氏名

**5. registration_date (登録日)**
- フィールド名: `registration_date`
- タイプ: 日付
- 説明: 車両登録日

**6. expiration_date (有効期限)**
- フィールド名: `expiration_date`
- タイプ: 日付
- 説明: 車検の有効期限

**7. image_url (画像URL)**
- フィールド名: `image_url`
- タイプ: テキスト
- 説明: 車検証画像のURL

#### ステータス管理フィールド

**8. status (ステータス)**
- フィールド名: `status`
- タイプ: 単一選択
- 選択肢:
  - `temporary`
  - `approved`

**9. approval_status (承認状態)**
- フィールド名: `approval_status`
- タイプ: 単一選択
- 選択肢:
  - `pending`
  - `approved`
  - `rejected`

**10. rejection_reason (却下理由)**
- フィールド名: `rejection_reason`
- タイプ: テキスト
- 説明: 却下された場合の理由

#### システムフィールド

**11. deleted_flag (削除フラグ)**
- フィールド名: `deleted_flag`
- タイプ: チェックボックス
- 説明: 論理削除フラグ

**12. deleted_at (削除日時)**
- フィールド名: `deleted_at`
- タイプ: 日付時刻
- 説明: 削除された日時

---

## 2. 任意保険証テーブル (insurance_policies)

### テーブルID
`tbl1flEr0zJoc4zv`

### 必須フィールド一覧（13個）

#### 基本情報フィールド

**1. policy_number (証券番号)**
- フィールド名: `policy_number`
- タイプ: テキスト
- 説明: 保険証券番号

**2. insurance_company (保険会社名)**
- フィールド名: `insurance_company`
- タイプ: テキスト
- 説明: 保険会社の名称

**3. policy_type (保険種別)**
- フィールド名: `policy_type`
- タイプ: テキスト
- 説明: 保険の種類（任意保険、自賠責など）

**4. coverage_start_date (補償開始日)**
- フィールド名: `coverage_start_date`
- タイプ: 日付
- 説明: 保険の補償開始日

**5. coverage_end_date (補償終了日)**
- フィールド名: `coverage_end_date`
- タイプ: 日付
- 説明: 保険の補償終了日

**6. insured_amount (補償金額)**
- フィールド名: `insured_amount`
- タイプ: 数値
- 説明: 保険金額（対人・対物など）

**7. image_url (画像URL)**
- フィールド名: `image_url`
- タイプ: テキスト
- 説明: 保険証券画像のURL

#### ステータス管理フィールド

**8. status (ステータス)**
- フィールド名: `status`
- タイプ: 単一選択
- 選択肢:
  - `temporary`
  - `approved`

**9. approval_status (承認状態)**
- フィールド名: `approval_status`
- タイプ: 単一選択
- 選択肢:
  - `pending`
  - `approved`
  - `rejected`

**10. rejection_reason (却下理由)**
- フィールド名: `rejection_reason`
- タイプ: テキスト
- 説明: 却下された場合の理由

#### システムフィールド

**11. created_at (作成日時)**
- フィールド名: `created_at`
- タイプ: 日付時刻
- 説明: レコード作成日時

**12. deleted_flag (削除フラグ)**
- フィールド名: `deleted_flag`
- タイプ: チェックボックス
- 説明: 論理削除フラグ

**13. deleted_at (削除日時)**
- フィールド名: `deleted_at`
- タイプ: 日付時刻
- 説明: 削除された日時

---

## 3. 社員マスタテーブル (employees)

### テーブルID
`tblqimCjDlzrxos9`

### 必須フィールド一覧（7個）

#### 基本情報フィールド

**1. employee_id (社員ID)**
- フィールド名: `employee_id`
- タイプ: テキスト
- 説明: 社員番号（一意）

**2. name (氏名)**
- フィールド名: `name`
- タイプ: テキスト
- 説明: 社員の氏名

**3. email (メールアドレス)**
- フィールド名: `email`
- タイプ: メール
- 説明: 社員のメールアドレス

**4. department (所属部署)**
- フィールド名: `department`
- タイプ: テキスト
- 説明: 所属部署名

**5. hire_date (入社日)**
- フィールド名: `hire_date`
- タイプ: 日付
- 説明: 入社年月日

**6. resignation_date (退職日)**
- フィールド名: `resignation_date`
- タイプ: 日付
- 説明: 退職年月日（在職中は空欄）

#### システムフィールド

**7. created_at (作成日時)**
- フィールド名: `created_at`
- タイプ: 日付時刻
- 説明: レコード作成日時

---

## 設定手順（全テーブル共通）

### ステップ1: Lark Baseを開く
1. Lark Base (https://your-domain.larksuite.com/base/NNLCbCdohajZpYsHCrkjy1adpNX) にアクセス
2. 設定するテーブルを選択

### ステップ2: フィールドを追加
1. テーブルの右端の「+」ボタンをクリック
2. フィールドタイプを選択
3. フィールド名を入力（上記リストの通り）
4. 単一選択の場合は選択肢を設定
5. 「保存」をクリック

### ステップ3: 各フィールドタイプの設定方法

#### テキストフィールド
- タイプを「テキスト」に選択
- フィールド名を入力

#### 数値フィールド
- タイプを「数値」に選択
- フィールド名を入力
- 小数点の桁数を設定（必要に応じて）

#### 日付フィールド
- タイプを「日付」に選択
- フィールド名を入力
- 日付形式を選択（YYYY-MM-DD推奨）

#### 日付時刻フィールド
- タイプを「日付時刻」に選択
- フィールド名を入力
- 日時形式を選択

#### 単一選択フィールド
- タイプを「単一選択」に選択
- フィールド名を入力
- 選択肢を1つずつ追加（Enterキーで確定）
- 「保存」をクリック

#### チェックボックスフィールド
- タイプを「チェックボックス」に選択
- フィールド名を入力

#### メールフィールド
- タイプを「メール」に選択
- フィールド名を入力

---

## 検証スクリプト

各テーブルの設定完了後、以下のスクリプトで検証できます：

### 車検証テーブルの検証
```bash
node scripts/verify-vehicle-registration-fields.js
```

### 任意保険証テーブルの検証
```bash
node scripts/verify-insurance-policy-fields.js
```

### 社員マスタテーブルの検証
```bash
node scripts/verify-employee-fields.js
```

---

## トラブルシューティング

### フィールドが追加できない
- Lark Baseへのアクセス権限を確認
- ブラウザをリロードして再試行

### 選択肢が保存されない
- 各選択肢を入力後、必ずEnterキーで確定
- 最後に「保存」ボタンをクリック

### フィールド名が英語で表示されない
- フィールド名は半角英数字で入力
- 大文字小文字、アンダースコアに注意

---

## 次のステップ

すべてのテーブルの設定が完了したら：

1. 検証スクリプトを実行
2. 開発サーバーを再起動: `npm run dev`
3. 各申請フォームでテスト:
   - 車検証申請: http://localhost:3003/dashboard/vehicle/new
   - 任意保険証申請: http://localhost:3003/dashboard/insurance/new
   - 社員情報登録: http://localhost:3003/dashboard/employees/new
