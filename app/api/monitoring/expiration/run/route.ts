import { NextRequest, NextResponse } from "next/server";
import { runExpirationMonitor } from "@/services/expiration-monitor.job";
import { requireAdmin } from "@/lib/auth-utils";

/**
 * POST /api/monitoring/expiration/run
 * 有効期限監視ジョブを手動実行（管理者のみ）
 */
export async function POST(request: NextRequest) {
  // 管理者権限チェック
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    console.log("[API] Manual expiration monitor job triggered");

    // バックグラウンドで実行（レスポンスを待たない）
    runExpirationMonitor()
      .then(() => {
        console.log("[API] Manual expiration monitor job completed");
      })
      .catch((error) => {
        console.error("[API] Manual expiration monitor job failed:", error);
      });

    return NextResponse.json({
      success: true,
      message: "Expiration monitor job started",
    });
  } catch (error) {
    console.error("Error in POST /api/monitoring/expiration/run:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to start expiration monitor job",
      },
      { status: 500 }
    );
  }
}
