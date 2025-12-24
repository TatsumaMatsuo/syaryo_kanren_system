import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

/**
 * GET /api/auth/me
 * 現在ログイン中のユーザー情報を取得
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: session.user,
        timestamp: Date.now(),
        instructions: {
          message: "このユーザー情報を使用して、Lark Baseに管理者レコードを作成してください",
          steps: [
            "1. Lark Baseの「ユーザー権限」テーブルを開く",
            "2. 新しいレコードを追加",
            "3. lark_user_id に user.id の値を入力",
            "4. user_name に user.name の値を入力",
            "5. user_email に user.email の値を入力",
            "6. role に 'admin' を選択",
            "7. granted_by に 'system' を入力",
            "8. granted_at, created_at, updated_at に上記の timestamp の値を入力",
          ],
        },
      },
    });
  } catch (error) {
    console.error("Error in GET /api/auth/me:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user info",
      },
      { status: 500 }
    );
  }
}
