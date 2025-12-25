"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Shield, Loader2 } from "lucide-react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const handleSignIn = async () => {
    await signIn("lark", { callbackUrl });
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl blur-lg opacity-75 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 p-4 rounded-2xl shadow-lg">
              <Car className="h-10 w-10 text-white drop-shadow-md" />
            </div>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">車両関連管理システム</CardTitle>
        <CardDescription>
          免許証・車検証・任意保険証の一元管理
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            <div className="flex items-start">
              <Shield className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">認証エラー</p>
                <p className="mt-1">
                  {error === "OAuthAccountNotLinked"
                    ? "このメールアドレスは既に別のアカウントと連携されています。"
                    : error === "OAuthCallback"
                    ? "認証中にエラーが発生しました。もう一度お試しください。"
                    : "ログインに失敗しました。もう一度お試しください。"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <div className="flex items-start">
            <Shield className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-blue-800">
              <p className="font-semibold">安全なログイン</p>
              <p className="mt-1">
                Lark (Feishu) アカウントでログインすると、組織内のデータに安全にアクセスできます。
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSignIn}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <svg
            className="mr-2 h-5 w-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          Lark でログイン
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

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md px-4">
        <Suspense fallback={<LoadingFallback />}>
          <SignInContent />
        </Suspense>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>© 2024 車両関連管理システム</p>
          <p className="mt-1">Powered by Lark & Next.js</p>
        </div>
      </div>
    </div>
  );
}
