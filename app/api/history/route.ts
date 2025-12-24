import { NextRequest, NextResponse } from "next/server";
import { getApprovalHistory } from "@/lib/lark-client";
import { requireAdmin } from "@/lib/auth-utils";

/**
 * GET /api/history
 * 承認履歴を取得（管理者のみ）
 */
export async function GET(request: NextRequest) {
  // 管理者権限チェック
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const { searchParams } = new URL(request.url);

    // クエリパラメータを取得
    const employee_id = searchParams.get("employee_id") || undefined;
    const approver_id = searchParams.get("approver_id") || undefined;
    const action = searchParams.get("action") as "approved" | "rejected" | undefined;
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const page_size = searchParams.get("page_size");
    const page_token = searchParams.get("page_token") || undefined;

    // 承認履歴を取得
    const response = await getApprovalHistory({
      employee_id,
      approver_id,
      action,
      start_date: start_date ? parseInt(start_date) : undefined,
      end_date: end_date ? parseInt(end_date) : undefined,
      pageSize: page_size ? parseInt(page_size) : undefined,
      pageToken: page_token,
    });

    // Lark SDK レスポンス構造: { code, msg, data }
    if (response.code !== 0) {
      throw new Error(`Lark API error: ${response.msg || "Unknown error"}`);
    }

    // レスポンスデータを整形してタイムスタンプでソート（新しい順）
    const histories = (response.data?.items?.map((item: any) => ({
      record_id: item.record_id,
      application_type: item.fields.application_type,
      application_id: item.fields.application_id,
      employee_id: item.fields.employee_id,
      employee_name: item.fields.employee_name,
      action: item.fields.action,
      approver_id: item.fields.approver_id,
      approver_name: item.fields.approver_name,
      reason: item.fields.reason || "",
      timestamp: item.fields.timestamp ? Number(item.fields.timestamp) : null,
      created_at: item.fields.created_at ? Number(item.fields.created_at) : null,
    })) || []).sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

    return NextResponse.json({
      success: true,
      data: histories,
      has_more: response.data?.has_more || false,
      page_token: response.data?.page_token,
      total: response.data?.total,
    });
  } catch (error) {
    console.error("Error in GET /api/history:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch approval history",
      },
      { status: 500 }
    );
  }
}
