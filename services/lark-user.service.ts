import { larkClient, getBaseRecords } from "@/lib/lark-client";
import { LARK_TABLES, EMPLOYEE_FIELDS } from "@/lib/lark-tables";
import { LarkUser } from "@/types";

/**
 * Larkユーザーを検索する
 * @param query 検索クエリ（名前またはメールアドレス）
 * @returns マッチしたユーザーのリスト
 */
export async function searchLarkUsers(query: string): Promise<LarkUser[]> {
  try {
    console.log('DEBUG searchLarkUsers - query:', query);

    if (!query || query.trim().length < 2) {
      console.log('DEBUG searchLarkUsers - query too short');
      return [];
    }

    // 従業員マスタテーブルから検索
    console.log('DEBUG searchLarkUsers - searching from employee table');
    const response = await getBaseRecords(LARK_TABLES.EMPLOYEES, {
      pageSize: 100,
    });

    console.log('DEBUG searchLarkUsers - Employee records count:', response.data?.items?.length || 0);

    if (!response.data?.items) {
      console.log('DEBUG searchLarkUsers - No employee data');
      return [];
    }

    // クエリでフィルタリング
    const queryLower = query.toLowerCase();
    const filteredUsers = response.data.items.filter((item: any) => {
      // フィールド名で取得
      const name = (item.fields[EMPLOYEE_FIELDS.employee_name] || "").toLowerCase();
      const email = (item.fields[EMPLOYEE_FIELDS.email] || "").toLowerCase();
      const employeeId = (item.fields[EMPLOYEE_FIELDS.employee_id] || "").toLowerCase();

      const matches = (
        name.includes(queryLower) ||
        email.includes(queryLower) ||
        employeeId.includes(queryLower)
      );

      console.log(`DEBUG - Employee ${item.fields[EMPLOYEE_FIELDS.employee_id]}: ${item.fields[EMPLOYEE_FIELDS.employee_name]} - matches: ${matches}`);

      return matches;
    });

    console.log('DEBUG searchLarkUsers - Filtered count:', filteredUsers.length);

    // LarkUser型に変換
    const users: LarkUser[] = filteredUsers.map((item: any) => ({
      open_id: item.fields[EMPLOYEE_FIELDS.employee_id] || item.record_id,
      union_id: undefined,
      user_id: item.fields[EMPLOYEE_FIELDS.employee_id],
      name: item.fields[EMPLOYEE_FIELDS.employee_name] || "",
      en_name: undefined,
      email: item.fields[EMPLOYEE_FIELDS.email] || "",
      mobile: undefined,
      avatar: undefined,
      department_ids: item.fields[EMPLOYEE_FIELDS.department] ? [item.fields[EMPLOYEE_FIELDS.department]] : undefined,
    }));

    console.log('DEBUG searchLarkUsers - Returning users:', users.length);

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
