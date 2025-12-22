import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "車両関連管理システム",
  description: "マイカー通勤申請・車両情報管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
