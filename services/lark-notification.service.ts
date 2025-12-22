import { larkClient } from "@/lib/lark-client";
import { ExpirationWarning } from "./expiration.service";

export interface NotificationTemplate {
  title: string;
  content: string;
}

/**
 * Lark Messengerでメッセージを送信
 * @param userId LarkユーザーのOpen ID
 * @param message 送信するメッセージ
 */
export async function sendLarkMessage(
  userId: string,
  message: NotificationTemplate
): Promise<boolean> {
  try {
    // Lark Message API を使用してメッセージを送信
    const response = await larkClient.im.message.create({
      params: {
        receive_id_type: "open_id",
      },
      data: {
        receive_id: userId,
        msg_type: "interactive",
        content: JSON.stringify({
          config: {
            wide_screen_mode: true,
          },
          header: {
            template: "orange",
            title: {
              content: message.title,
              tag: "plain_text",
            },
          },
          elements: [
            {
              tag: "div",
              text: {
                content: message.content,
                tag: "lark_md",
              },
            },
          ],
        }),
      },
    });

    return response.code === 0;
  } catch (error) {
    console.error("Failed to send Lark message:", error);
    return false;
  }
}

/**
 * 有効期限警告通知のテンプレートを生成
 */
export function createExpirationWarningTemplate(
  warning: ExpirationWarning
): NotificationTemplate {
  const documentTypeMap = {
    license: "免許証",
    vehicle: "車検証",
    insurance: "任意保険証",
  };

  const documentType = documentTypeMap[warning.type];
  const expirationDateStr = warning.expirationDate.toLocaleDateString("ja-JP");

  return {
    title: `【重要】${documentType}の有効期限が近づいています`,
    content: `**書類種類**: ${documentType}
**証明書番号**: ${warning.documentNumber}
**有効期限**: ${expirationDateStr}
**残り日数**: ${warning.daysUntilExpiration}日

有効期限が近づいています。早めの更新手続きをお願いします。
更新が完了したら、システムから再度申請を行ってください。`,
  };
}

/**
 * 有効期限切れ通知のテンプレートを生成
 */
export function createExpiredNotificationTemplate(
  warning: ExpirationWarning
): NotificationTemplate {
  const documentTypeMap = {
    license: "免許証",
    vehicle: "車検証",
    insurance: "任意保険証",
  };

  const documentType = documentTypeMap[warning.type];
  const expirationDateStr = warning.expirationDate.toLocaleDateString("ja-JP");
  const daysOverdue = Math.abs(warning.daysUntilExpiration);

  return {
    title: `【緊急】${documentType}の有効期限が切れています`,
    content: `**書類種類**: ${documentType}
**証明書番号**: ${warning.documentNumber}
**有効期限**: ${expirationDateStr}
**期限超過**: ${daysOverdue}日

有効期限が切れています。至急、更新手続きを行ってください。
有効期限が切れた状態での業務は認められません。

更新が完了したら、システムから再度申請を行ってください。`,
  };
}

/**
 * 管理者向け期限切れ通知のテンプレートを生成
 */
export function createAdminExpiredNotificationTemplate(
  warnings: ExpirationWarning[]
): NotificationTemplate {
  const documentTypeMap = {
    license: "免許証",
    vehicle: "車検証",
    insurance: "任意保険証",
  };

  const warningList = warnings
    .map((w) => {
      const docType = documentTypeMap[w.type];
      const dateStr = w.expirationDate.toLocaleDateString("ja-JP");
      return `- ${docType} (${w.documentNumber}): ${dateStr} - ${Math.abs(
        w.daysUntilExpiration
      )}日超過`;
    })
    .join("\n");

  return {
    title: `【管理者通知】期限切れ書類があります (${warnings.length}件)`,
    content: `以下の書類の有効期限が切れています。
該当社員への対応をお願いします。

${warningList}

各社員に更新を促し、更新完了後は再申請を依頼してください。`,
  };
}

/**
 * 複数ユーザーに一括通知を送信
 */
export async function sendBulkNotifications(
  notifications: Array<{ userId: string; message: NotificationTemplate }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const notification of notifications) {
    const result = await sendLarkMessage(
      notification.userId,
      notification.message
    );
    if (result) {
      success++;
    } else {
      failed++;
    }
    // レート制限対策: 少し待機
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { success, failed };
}
