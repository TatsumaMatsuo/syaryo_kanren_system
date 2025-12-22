import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getUserPermission,
  isAdmin,
  hasViewPermission,
} from "@/services/user-permission.service";

/**
 * 現在のユーザーのLark User IDを取得
 */
export async function getCurrentLarkUserId(): Promise<string | null> {
  try {
    const session = await getServerSession();
    // TODO: NextAuth sessionからLark User IDを取得
    // 現在はモック実装
    return session?.user?.email || null;
  } catch (error) {
    console.error("Failed to get current user ID:", error);
    return null;
  }
}

/**
 * 管理者権限をチェック
 */
export async function requireAdmin() {
  const userId = await getCurrentLarkUserId();

  if (!userId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const adminCheck = await isAdmin(userId);

  if (!adminCheck) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, userId };
}

/**
 * 閲覧権限以上をチェック（管理者または閲覧者）
 */
export async function requireViewPermission() {
  const userId = await getCurrentLarkUserId();

  if (!userId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const viewPermission = await hasViewPermission(userId);

  if (!viewPermission) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden - View access required" },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, userId };
}

/**
 * ユーザーの権限情報を取得
 */
export async function getCurrentUserPermission() {
  const userId = await getCurrentLarkUserId();

  if (!userId) {
    return null;
  }

  return await getUserPermission(userId);
}
