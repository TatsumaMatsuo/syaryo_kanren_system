# 認証機能実装ガイド

## 📝 実装概要

NextAuth.js + Lark OAuthを使用した認証機能を実装し、ハードコードされたユーザーIDを実際のセッションから取得するように更新しました。

## 🎯 実装内容

### 1. SessionProvider の追加

**新規ファイル**: `components/providers/session-provider.tsx`

NextAuth.jsの`SessionProvider`をラップしたクライアントコンポーネントを作成し、ルートレイアウトに統合しました。

```typescript
// app/layout.tsx
import { SessionProvider } from "@/components/providers/session-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

### 2. Auth Utilsの更新

**更新ファイル**: `lib/auth-utils.ts`

#### 主な変更点:

**Before:**
```typescript
export async function getCurrentLarkUserId(): Promise<string | null> {
  const session = await getServerSession();
  // TODO: NextAuth sessionからLark User IDを取得
  return session?.user?.email || null;
}
```

**After:**
```typescript
export async function getCurrentLarkUserId(): Promise<string | null> {
  const session = await getServerSession();
  if (!session || !session.user) {
    return null;
  }
  // NextAuthのセッションからuser.idを取得
  return (session.user as any).id || session.user.email || null;
}
```

#### 新規追加:
```typescript
export async function getCurrentUser() {
  // サーバーサイドで現在のユーザー情報を取得
  const session = await getServerSession();
  if (!session || !session.user) {
    return null;
  }

  return {
    id: (session.user as any).id || null,
    name: session.user.name || null,
    email: session.user.email || null,
    image: session.user.image || null,
  };
}
```

### 3. ダッシュボードの更新

**更新ファイル**: `app/(applicant)/dashboard/page.tsx`

#### 主な変更点:

1. **セッションフックの使用**:
```typescript
import { useSession } from "next-auth/react";

const { data: session, status } = useSession();
```

2. **認証チェックとリダイレクト**:
```typescript
useEffect(() => {
  if (status === "unauthenticated") {
    router.push("/auth/signin");
  }
}, [status, router]);
```

3. **ローディング状態の表示**:
```typescript
if (status === "loading") {
  return <LoadingSpinner />;
}
```

4. **実際のユーザー情報を使用**:
```typescript
const user = {
  name: session.user.name || "ゲスト",
  employee_id: (session.user as any).id || session.user.email || "N/A",
};
```

### 4. 申請フォームの更新

**更新ファイル**:
- `app/(applicant)/dashboard/license/new/page.tsx`
- `app/(applicant)/dashboard/vehicle/new/page.tsx`
- `app/(applicant)/dashboard/insurance/new/page.tsx`

#### 主な変更点:

1. **セッションの使用**:
```typescript
const { data: session, status } = useSession();
```

2. **認証チェック**:
```typescript
if (!session || !session.user) {
  setError("ログインしてください");
  return;
}
```

3. **セッションからユーザーIDを取得**:
```typescript
// Before
const employeeId = "EMP001"; // ハードコード

// After
const employeeId = (session.user as any).id || session.user.email || "unknown";
```

## 🔑 認証フロー

### ユーザーログイン

1. ユーザーが `/auth/signin` にアクセス
2. 「Larkでログイン」ボタンをクリック
3. Lark OAuth画面でログイン
4. コールバックURLにリダイレクト (`/dashboard`)
5. NextAuthがセッションを作成
6. アプリケーション全体でセッションが利用可能に

### セッション保護されたページ

```typescript
// クライアントコンポーネント
const { data: session, status } = useSession();

useEffect(() => {
  if (status === "unauthenticated") {
    router.push("/auth/signin");
  }
}, [status, router]);
```

### サーバーサイド認証

```typescript
import { getCurrentLarkUserId } from "@/lib/auth-utils";

export async function GET() {
  const userId = await getCurrentLarkUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 認証済みユーザーの処理
}
```

## 📊 セッションデータ構造

NextAuthセッションに含まれるデータ:

```typescript
{
  user: {
    id: string,        // Lark user ID (open_id または union_id)
    name: string,      // ユーザー名
    email: string,     // メールアドレス
    image: string,     // プロフィール画像URL
  },
  accessToken: string, // Larkアクセストークン
}
```

## ⚙️ NextAuth設定

**ファイル**: `app/api/auth/[...nextauth]/route.ts`

### Lark OAuthプロバイダー設定

```typescript
{
  id: "lark",
  name: "Lark (Feishu)",
  type: "oauth",
  authorization: {
    url: "https://open.feishu.cn/open-apis/authen/v1/index",
    params: {
      app_id: process.env.LARK_OAUTH_CLIENT_ID,
      redirect_uri: process.env.LARK_OAUTH_REDIRECT_URI,
    },
  },
  profile(profile) {
    return {
      id: profile.open_id || profile.union_id,
      name: profile.name,
      email: profile.email || profile.enterprise_email,
      image: profile.avatar_url || profile.avatar_thumb,
    };
  },
}
```

### コールバック設定

```typescript
callbacks: {
  async jwt({ token, user, account }) {
    if (account && user) {
      return {
        ...token,
        accessToken: account.access_token,
        userId: user.id,
      };
    }
    return token;
  },
  async session({ session, token }) {
    return {
      ...session,
      user: {
        ...session.user,
        id: token.userId,
      },
      accessToken: token.accessToken,
    };
  },
}
```

## 🧪 テスト方法

### 1. 認証されていない状態でダッシュボードにアクセス

```
http://localhost:3001/dashboard
```

**期待される動作**: `/auth/signin` にリダイレクト

### 2. ログイン

1. `/auth/signin` でLarkログインボタンをクリック
2. Larkアカウントでログイン
3. ダッシュボードにリダイレクト
4. ユーザー名とIDが表示される

### 3. セッション情報の確認

```
http://localhost:3001/api/auth/me
```

**期待される応答**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "ou_xxxxx",
      "name": "山田太郎",
      "email": "yamada@example.com",
      "image": "https://..."
    },
    "timestamp": 1234567890
  }
}
```

## ⚠️ 注意事項

### 環境変数の設定

`.env.local` に以下の環境変数が必要:

```env
# Lark OAuth
LARK_OAUTH_CLIENT_ID=cli_xxxxx
LARK_OAUTH_CLIENT_SECRET=xxxxx
LARK_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/callback/lark

# NextAuth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=xxxxx  # openssl rand -base64 32 で生成
```

### Lark Baseの権限テーブル

ユーザーがログインしたら、Lark Baseの「user_permissions」テーブルに以下のレコードを手動で追加してください:

- **lark_user_id**: セッションの`user.id`
- **user_name**: セッションの`user.name`
- **user_email**: セッションの`user.email`
- **role**: `admin` または `viewer`
- **granted_by**: `system`

`/api/auth/me` エンドポイントにアクセスすると、必要な情報が表示されます。

### タイプセーフティ

セッションの`user.id`にアクセスする際は型アサーションが必要:

```typescript
(session.user as any).id
```

より良いアプローチとして、型定義を拡張できます:

```typescript
// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }
}
```

## 🚀 今後の改善

1. **型定義の拡張**: NextAuthの型をプロジェクト固有の型に拡張
2. **ミドルウェア**: Next.js Middlewareを使用したルート保護
3. **ロールベースアクセス制御**: 管理者と一般ユーザーの権限分離
4. **セッション有効期限**: 自動ログアウトとリフレッシュトークン
5. **エラーハンドリング**: より詳細な認証エラーメッセージ

---

実装日: 2024-12-24
