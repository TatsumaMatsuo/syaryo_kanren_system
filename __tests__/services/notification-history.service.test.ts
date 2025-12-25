import { describe, it, expect, vi, beforeEach } from "vitest";

// Larkクライアントをモック
vi.mock("@/lib/lark-client", () => ({
  getBaseRecords: vi.fn(),
  createBaseRecord: vi.fn(),
}));

vi.mock("@/lib/lark-tables", () => ({
  LARK_TABLES: {
    NOTIFICATION_HISTORY: "tbl_notification_history",
  },
  NOTIFICATION_HISTORY_FIELDS: {
    recipient_id: "recipient_id",
    notification_type: "notification_type",
    document_type: "document_type",
    document_id: "document_id",
    title: "title",
    message: "message",
    sent_at: "sent_at",
    status: "status",
    created_at: "created_at",
  },
}));

import {
  createNotificationHistory,
  isDuplicateNotification,
} from "@/services/notification-history.service";
import { getBaseRecords, createBaseRecord } from "@/lib/lark-client";

describe("notification-history.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("createNotificationHistory", () => {
    it("通知履歴を正常に作成する", async () => {
      vi.mocked(createBaseRecord).mockResolvedValue({
        data: {
          record: {
            record_id: "rec123",
          },
        },
      });

      const result = await createNotificationHistory({
        recipient_id: "user1",
        notification_type: "expiration_warning",
        document_type: "license",
        document_id: "doc1",
        title: "テスト通知",
        message: "テストメッセージ",
        status: "sent",
      });

      expect(result.id).toBe("rec123");
      expect(result.recipient_id).toBe("user1");
      expect(result.notification_type).toBe("expiration_warning");
      expect(result.status).toBe("sent");
    });
  });

  describe("isDuplicateNotification", () => {
    it("24時間以内に同じ通知がある場合はtrueを返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [{ record_id: "existing" }],
        },
      });

      const result = await isDuplicateNotification(
        "user1",
        "doc1",
        "expiration_warning"
      );

      expect(result).toBe(true);
    });

    it("24時間以内に同じ通知がない場合はfalseを返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [],
        },
      });

      const result = await isDuplicateNotification(
        "user1",
        "doc1",
        "expiration_warning"
      );

      expect(result).toBe(false);
    });

    it("エラー時はfalseを返す", async () => {
      vi.mocked(getBaseRecords).mockRejectedValue(new Error("API Error"));

      const result = await isDuplicateNotification(
        "user1",
        "doc1",
        "expiration_warning"
      );

      expect(result).toBe(false);
    });
  });
});
