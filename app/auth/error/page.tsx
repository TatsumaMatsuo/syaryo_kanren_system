"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return {
          title: "設定エラー",
          description: "認証の設定に問題があります。システム管理者に連絡してください。",
        };
      case "AccessDenied":
        return {
          title: "アクセス拒否",
          description: "このアプリケーションへのアクセス権限がありません。",
        };
      case "Verification":
        return {
          title: "検証エラー",
          description: "トークンの検証に失敗しました。もう一度ログインしてください。",
        };
      case "OAuthSignin":
        return {
          title: "OAuth サインインエラー",
          description: "OAuthプロバイダーへのサインインに失敗しました。",
        };
      case "OAuthCallback":
        return {
          title: "OAuth コールバックエラー",
          description: "認証プロセス中にエラーが発生しました。",
        };
      case "OAuthCreateAccount":
        return {
          title: "アカウント作成エラー",
          description: "OAuthアカウントの作成に失敗しました。",
        };
      case "EmailCreateAccount":
        return {
          title: "メールアカウント作成エラー",
          description: "メールアカウントの作成に失敗しました。",
        };
      case "Callback":
        return {
          title: "コールバックエラー",
          description: "認証コールバック中にエラーが発生しました。",
        };
      case "OAuthAccountNotLinked":
        return {
          title: "アカウント未リンク",
          description: "このメールアドレスは既に別のアカウントと連携されています。",
        };
      case "EmailSignin":
        return {
          title: "メールサインインエラー",
          description: "確認メールの送信に失敗しました。",
        };
      case "CredentialsSignin":
        return {
          title: "認証情報エラー",
          description: "ログイン情報が正しくありません。",
        };
      case "SessionRequired":
        return {
          title: "セッション必須",
          description: "このページにアクセスするにはログインが必要です。",
        };
      default:
        return {
          title: "認証エラー",
          description: "予期しないエラーが発生しました。もう一度お試しください。",
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-600 p-3 rounded-full">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-red-900">
          {errorInfo.title}
        </CardTitle>
        <CardDescription className="text-base">
          {errorInfo.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-mono">
              エラーコード: {error}
            </p>
          </div>
        )}

        <div className="text-sm text-gray-700 space-y-2">
          <p className="font-semibold">解決方法:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>もう一度ログインを試してください</li>
            <li>ブラウザのキャッシュをクリアしてください</li>
            <li>問題が解決しない場合は、システム管理者に連絡してください</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          asChild
          className="flex-1"
          variant="outline"
        >
          <Link href="/">ホームに戻る</Link>
        </Button>
        <Button
          asChild
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          <Link href="/auth/signin">再度ログイン</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="shadow-xl">
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </CardContent>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="w-full max-w-md px-4">
        <Suspense fallback={<LoadingFallback />}>
          <AuthErrorContent />
        </Suspense>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>サポートが必要な場合は、システム管理者にお問い合わせください</p>
        </div>
      </div>
    </div>
  );
}
