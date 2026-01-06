import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getUserPermission,
  isAdmin,
  hasViewPermission,
} from "@/services/user-permission.service";
import { MembershipType } from "@/types";

/**
 * 現在のユーザーのLark User IDを取得
 */
export async function getCurrentLarkUserId(): Promise<string | null> {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return null;
    }

    // employee_idはメールアドレスで統一
    return session.user.email || null;
  } catch (error) {
    console.error("Failed to get current user ID:", error);
    return null;
  }
}

/**
 * サーバーサイドで現在のユーザー情報を取得
 */
export async function getCurrentUser() {
  try {
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
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}

/**
 * 認証のみチェック（権限は問わない）
 */
export async function requireAuth() {
  const session = await getServerSession();

  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  // employee_idはメールアドレスで統一
  const userId = session.user.email || null;

  return {
    authorized: true,
    userId,
    user: session.user,
  };
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

/**
 * 現在のユーザーのメンバーシップタイプを取得
 */
export async function getCurrentMembershipType(): Promise<MembershipType | null> {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return null;
    }

    return (session.user as any).membershipType || null;
  } catch (error) {
    console.error("Failed to get membership type:", error);
    return null;
  }
}

/**
 * 内部社員かどうかをチェック
 */
export async function isInternalMember(): Promise<boolean> {
  const membershipType = await getCurrentMembershipType();
  return membershipType === "internal";
}

/**
 * 外部メンバー（external または contractor）かどうかをチェック
 */
export async function isExternalMember(): Promise<boolean> {
  const membershipType = await getCurrentMembershipType();
  return membershipType === "external" || membershipType === "contractor";
}

/**
 * 内部社員のみアクセス可能な機能をチェック
 * 外部メンバーの場合は403エラーを返す
 */
export async function requireInternalMember() {
  const authResult = await requireAuth();

  if (!authResult.authorized) {
    return authResult;
  }

  const membershipType = (authResult.user as any)?.membershipType;

  if (membershipType !== "internal") {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: "この機能は内部社員のみ利用可能です",
          errorCode: "EXTERNAL_MEMBER_RESTRICTED"
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId: authResult.userId,
    user: authResult.user,
    membershipType: membershipType as MembershipType,
  };
}

/**
 * メンバーシップタイプに基づく機能制限情報を取得
 */
export interface MembershipRestrictions {
  canViewAllEmployees: boolean;      // 全社員データ閲覧
  canExportData: boolean;            // データエクスポート
  canViewAnalytics: boolean;         // 分析ダッシュボード
  canAccessAdminPanel: boolean;      // 管理画面アクセス
  canViewOtherDepartments: boolean;  // 他部署データ閲覧
}

export function getMembershipRestrictions(membershipType: MembershipType | null): MembershipRestrictions {
  // 内部社員: 全機能利用可能
  if (membershipType === "internal") {
    return {
      canViewAllEmployees: true,
      canExportData: true,
      canViewAnalytics: true,
      canAccessAdminPanel: true,
      canViewOtherDepartments: true,
    };
  }

  // 業務委託: 一部制限
  if (membershipType === "contractor") {
    return {
      canViewAllEmployees: false,
      canExportData: false,
      canViewAnalytics: false,
      canAccessAdminPanel: false,
      canViewOtherDepartments: false,
    };
  }

  // 外部メンバー: 最も制限
  if (membershipType === "external") {
    return {
      canViewAllEmployees: false,
      canExportData: false,
      canViewAnalytics: false,
      canAccessAdminPanel: false,
      canViewOtherDepartments: false,
    };
  }

  // 不明なタイプ: 最も制限的
  return {
    canViewAllEmployees: false,
    canExportData: false,
    canViewAnalytics: false,
    canAccessAdminPanel: false,
    canViewOtherDepartments: false,
  };
}
