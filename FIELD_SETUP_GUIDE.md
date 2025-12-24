# Lark Base フィールド設定ガイド

## 免許証テーブル (drivers_licenses) の設定手順

### 現在の状態
テーブルには4つのデフォルトフィールドがあります:
- テキスト
- 単一選択
- 日付
- 添付ファイル

### 必要なフィールド設定

以下のフィールドを設定してください:

#### 1. employee_id (社員ID)
- **フィールド名**: `employee_id`
- **タイプ**: テキスト
- **設定方法**: 既存の「テキスト」フィールドの名前を変更

#### 2. license_number (免許証番号)
- **フィールド名**: `license_number`
- **タイプ**: テキスト
- **設定方法**: 新規フィールドを追加

#### 3. license_type (免許種別)
- **フィールド名**: `license_type`
- **タイプ**: 単一選択
- **選択肢**: 普通, 準中型, 中型, 大型
- **設定方法**: 既存の「単一選択」フィールドの名前を変更し、選択肢を設定

#### 4. expiration_date (有効期限)
- **フィールド名**: `expiration_date`
- **タイプ**: 日付
- **設定方法**: 既存の「日付」フィールドの名前を変更

#### 5. image_url (画像URL)
- **フィールド名**: `image_url`
- **タイプ**: テキスト
- **設定方法**: 新規フィールドを追加

#### 6. status (ステータス)
- **フィールド名**: `status`
- **タイプ**: 単一選択
- **選択肢**: temporary, approved
- **設定方法**: 新規フィールドを追加

#### 7. approval_status (承認状態)
- **フィールド名**: `approval_status`
- **タイプ**: 単一選択
- **選択肢**: pending, approved, rejected
- **設定方法**: 新規フィールドを追加

## 設定手順

### ステップ1: Lark Baseを開く
1. https://example.larksuite.com/base/NNLCbCdohajZpYsHCrkjy1adpNX にアクセス
2. `drivers_licenses` テーブルを開く

### ステップ2: 既存フィールドの名前変更
1. 「テキスト」フィールドのヘッダーをクリック
2. 「フィールド設定」を選択
3. フィールド名を `employee_id` に変更

4. 「単一選択」フィールドのヘッダーをクリック
5. フィールド名を `license_type` に変更
6. 選択肢を追加: 普通, 準中型, 中型, 大型

7. 「日付」フィールドのヘッダーをクリック
8. フィールド名を `expiration_date` に変更

### ステップ3: 新規フィールドの追加
1. テーブルの右端の「+」ボタンをクリック
2. 以下のフィールドを1つずつ追加:

   a. **license_number**
   - タイプ: テキスト
   - フィールド名: license_number

   b. **image_url**
   - タイプ: テキスト
   - フィールド名: image_url

   c. **status**
   - タイプ: 単一選択
   - フィールド名: status
   - 選択肢: temporary, approved

   d. **approval_status**
   - タイプ: 単一選択
   - フィールド名: approval_status
   - 選択肢: pending, approved, rejected

### ステップ4: 設定確認
ターミナルで以下のコマンドを実行して設定を確認:
```bash
node verify-fields.js
```

すべてのフィールドに✅が表示されれば完了です。

### ステップ5: テスト
1. レコード作成テスト:
   ```bash
   node test-create-record.js
   ```

2. ブラウザでテスト:
   http://localhost:3002/dashboard/license/new

## トラブルシューティング

### フィールド名が英語で表示されない
- フィールド設定で「フィールド名」を正確に入力してください
- 大文字小文字、スペース、アンダースコアに注意

### 選択肢が保存されない
- 選択肢を追加後、必ず「保存」ボタンをクリック
- 各選択肢は Enter キーで確定

### その他の問題
- ブラウザをリロード
- Lark Base のキャッシュをクリア
- 開発サーバーを再起動: `npm run dev`
