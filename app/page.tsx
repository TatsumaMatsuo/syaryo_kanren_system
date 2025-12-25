import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { hasViewPermission } from "@/services/user-permission.service";

export default async function Home() {
  const session = await getServerSession();

  // 未ログインの場合はログインページへ
  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  // 管理者または閲覧者チェック（メールアドレスで権限を確認）
  const userEmail = session.user.email;
  if (userEmail) {
    const hasPermission = await hasViewPermission(userEmail);
    if (hasPermission) {
      // 管理者・閲覧者は管理画面へ
      redirect("/admin/applications");
    }
  }

  // 一般ユーザー（権限なし）はダッシュボードへ
  redirect("/dashboard");
}
