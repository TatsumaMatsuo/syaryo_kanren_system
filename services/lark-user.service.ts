import { larkClient } from "@/lib/lark-client";
import { LarkUser } from "@/types";

/**
 * Larkユーザーを検索する
 * @param query 検索クエリ（名前またはメールアドレス）
 * @returns マッチしたユーザーのリスト
 */
export async function searchLarkUsers(query: string): Promise<LarkUser[]> {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Lark Contact API を使用してユーザーを検索
    const response = await larkClient.contact.user.list({
      params: {
        page_size: 50,
        // 部門ID指定なしで全ユーザーを取得
      },
    });

    if (!response.data?.items) {
      return [];
    }

    // クエリでフィルタリング
    const queryLower = query.toLowerCase();
    const filteredUsers = response.data.items.filter((user: any) => {
      const name = user.name?.toLowerCase() || "";
      const email = user.email?.toLowerCase() || "";
      const enName = user.en_name?.toLowerCase() || "";

      return (
        name.includes(queryLower) ||
        email.includes(queryLower) ||
        enName.includes(queryLower)
      );
    });

    // LarkUser型に変換
    const users: LarkUser[] = filteredUsers.map((user: any) => ({
      open_id: user.open_id || "",
      union_id: user.union_id,
      user_id: user.user_id,
      name: user.name || "",
      en_name: user.en_name,
      email: user.email || "",
      mobile: user.mobile,
      avatar: user.avatar,
      department_ids: user.department_ids,
    }));

    return users;
  } catch (error) {
    console.error("Failed to search Lark users:", error);
    return [];
  }
}

/**
 * 特定のLarkユーザー情報を取得
 * @param openId ユーザーのopen_id
 * @returns ユーザー情報
 */
export async function getLarkUser(openId: string): Promise<LarkUser | null> {
  try {
    const response = await larkClient.contact.user.get({
      path: {
        user_id: openId,
      },
      params: {
        user_id_type: "open_id",
      },
    });

    if (!response.data?.user) {
      return null;
    }

    const user = response.data.user;
    return {
      open_id: user.open_id || "",
      union_id: user.union_id,
      user_id: user.user_id,
      name: user.name || "",
      en_name: user.en_name,
      email: user.email || "",
      mobile: user.mobile,
      avatar: user.avatar,
      department_ids: user.department_ids,
    };
  } catch (error) {
    console.error("Failed to get Lark user:", error);
    return null;
  }
}

/**
 * 現在のユーザー情報を取得（アクセストークンから）
 * @param accessToken ユーザーアクセストークン
 * @returns ユーザー情報
 */
export async function getCurrentLarkUser(
  accessToken: string
): Promise<LarkUser | null> {
  try {
    // TODO: アクセストークンを使用してユーザー情報を取得
    // 現在はモック実装
    return null;
  } catch (error) {
    console.error("Failed to get current Lark user:", error);
    return null;
  }
}
