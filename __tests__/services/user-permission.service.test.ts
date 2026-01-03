import { describe, it, expect, vi, beforeEach } from "vitest";
import { USER_PERMISSION_FIELDS } from "@/lib/lark-tables";

// Lark clientをモック
vi.mock("@/lib/lark-client", () => ({
  getBaseRecords: vi.fn(),
  createBaseRecord: vi.fn(),
  updateBaseRecord: vi.fn(),
  hardDeleteBaseRecord: vi.fn(),
}));

import {
  getUserPermissions,
  getUserPermission,
  createUserPermission,
  updateUserPermission,
  deleteUserPermission,
  isAdmin,
  hasViewPermission,
} from "@/services/user-permission.service";
import {
  getBaseRecords,
  createBaseRecord,
  updateBaseRecord,
  hardDeleteBaseRecord,
} from "@/lib/lark-client";

describe("user-permission.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserPermissions", () => {
    it("ユーザー権限一覧を取得する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [USER_PERMISSION_FIELDS.lark_user_id]: "user001",
                [USER_PERMISSION_FIELDS.user_name]: "山田太郎",
                [USER_PERMISSION_FIELDS.user_email]: "yamada@example.com",
                [USER_PERMISSION_FIELDS.role]: "admin",
                [USER_PERMISSION_FIELDS.granted_by]: "システム管理者",
                [USER_PERMISSION_FIELDS.granted_at]: now,
                [USER_PERMISSION_FIELDS.created_at]: now,
                [USER_PERMISSION_FIELDS.updated_at]: now,
              },
            },
            {
              record_id: "rec2",
              fields: {
                [USER_PERMISSION_FIELDS.lark_user_id]: "user002",
                [USER_PERMISSION_FIELDS.user_name]: "佐藤花子",
                [USER_PERMISSION_FIELDS.user_email]: "sato@example.com",
                [USER_PERMISSION_FIELDS.role]: "viewer",
                [USER_PERMISSION_FIELDS.granted_by]: "山田太郎",
                [USER_PERMISSION_FIELDS.granted_at]: now,
                [USER_PERMISSION_FIELDS.created_at]: now,
                [USER_PERMISSION_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getUserPermissions();

      expect(result).toHaveLength(2);
      expect(result[0].lark_user_id).toBe("user001");
      expect(result[0].role).toBe("admin");
      expect(result[1].lark_user_id).toBe("user002");
      expect(result[1].role).toBe("viewer");
    });

    it("データがない場合は空配列を返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getUserPermissions();

      expect(result).toEqual([]);
    });

    it("エラー時は空配列を返す", async () => {
      vi.mocked(getBaseRecords).mockRejectedValue(new Error("API Error"));

      const result = await getUserPermissions();

      expect(result).toEqual([]);
    });
  });

  describe("getUserPermission", () => {
    it("LarkユーザーIDで権限を取得する", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [USER_PERMISSION_FIELDS.lark_user_id]: "user001",
                [USER_PERMISSION_FIELDS.user_name]: "山田太郎",
                [USER_PERMISSION_FIELDS.user_email]: "yamada@example.com",
                [USER_PERMISSION_FIELDS.role]: "admin",
                [USER_PERMISSION_FIELDS.granted_by]: "システム管理者",
                [USER_PERMISSION_FIELDS.granted_at]: now,
                [USER_PERMISSION_FIELDS.created_at]: now,
                [USER_PERMISSION_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await getUserPermission("user001");

      expect(result).not.toBeNull();
      expect(result?.lark_user_id).toBe("user001");
      expect(result?.role).toBe("admin");
    });

    it("メールアドレスで権限を取得する（open_idで見つからない場合）", async () => {
      const now = Date.now();
      // 1回目のopen_id検索では見つからない
      vi.mocked(getBaseRecords)
        .mockResolvedValueOnce({
          data: { items: [] },
        } as any)
        // 2回目のメール検索で見つかる
        .mockResolvedValueOnce({
          data: {
            items: [
              {
                record_id: "rec1",
                fields: {
                  [USER_PERMISSION_FIELDS.lark_user_id]: "user001",
                  [USER_PERMISSION_FIELDS.user_name]: "山田太郎",
                  [USER_PERMISSION_FIELDS.user_email]: "yamada@example.com",
                  [USER_PERMISSION_FIELDS.role]: "admin",
                  [USER_PERMISSION_FIELDS.granted_by]: "システム管理者",
                  [USER_PERMISSION_FIELDS.granted_at]: now,
                  [USER_PERMISSION_FIELDS.created_at]: now,
                  [USER_PERMISSION_FIELDS.updated_at]: now,
                },
              },
            ],
          },
        } as any);

      const result = await getUserPermission("yamada@example.com");

      expect(result).not.toBeNull();
      expect(result?.user_email).toBe("yamada@example.com");
    });

    it("存在しない場合はnullを返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await getUserPermission("nonexistent");

      expect(result).toBeNull();
    });

    it("エラー時はnullを返す", async () => {
      vi.mocked(getBaseRecords).mockRejectedValue(new Error("API Error"));

      const result = await getUserPermission("user001");

      expect(result).toBeNull();
    });
  });

  describe("createUserPermission", () => {
    it("ユーザー権限を新規作成する", async () => {
      vi.mocked(createBaseRecord).mockResolvedValue({
        data: {
          record: {
            record_id: "new_rec",
          },
        },
      } as any);

      const data = {
        lark_user_id: "user001",
        user_name: "山田太郎",
        user_email: "yamada@example.com",
        role: "admin" as const,
        granted_by: "システム管理者",
      };

      const result = await createUserPermission(data);

      expect(result.id).toBe("new_rec");
      expect(result.lark_user_id).toBe("user001");
      expect(result.role).toBe("admin");
      expect(createBaseRecord).toHaveBeenCalled();
    });
  });

  describe("updateUserPermission", () => {
    it("ユーザー権限を更新する", async () => {
      vi.mocked(updateBaseRecord).mockResolvedValue({} as any);

      await updateUserPermission("rec1", { role: "viewer" });

      expect(updateBaseRecord).toHaveBeenCalledWith(
        expect.any(String),
        "rec1",
        expect.objectContaining({
          [USER_PERMISSION_FIELDS.role]: "viewer",
        })
      );
    });
  });

  describe("deleteUserPermission", () => {
    it("ユーザー権限を削除する", async () => {
      vi.mocked(hardDeleteBaseRecord).mockResolvedValue({} as any);

      await deleteUserPermission("rec1");

      expect(hardDeleteBaseRecord).toHaveBeenCalledWith(expect.any(String), "rec1");
    });
  });

  describe("isAdmin", () => {
    it("管理者の場合はtrueを返す", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [USER_PERMISSION_FIELDS.lark_user_id]: "user001",
                [USER_PERMISSION_FIELDS.user_name]: "山田太郎",
                [USER_PERMISSION_FIELDS.user_email]: "yamada@example.com",
                [USER_PERMISSION_FIELDS.role]: "admin",
                [USER_PERMISSION_FIELDS.granted_at]: now,
                [USER_PERMISSION_FIELDS.created_at]: now,
                [USER_PERMISSION_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await isAdmin("user001");

      expect(result).toBe(true);
    });

    it("管理者でない場合はfalseを返す", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [USER_PERMISSION_FIELDS.lark_user_id]: "user001",
                [USER_PERMISSION_FIELDS.user_name]: "山田太郎",
                [USER_PERMISSION_FIELDS.user_email]: "yamada@example.com",
                [USER_PERMISSION_FIELDS.role]: "viewer",
                [USER_PERMISSION_FIELDS.granted_at]: now,
                [USER_PERMISSION_FIELDS.created_at]: now,
                [USER_PERMISSION_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await isAdmin("user001");

      expect(result).toBe(false);
    });

    it("権限がない場合はfalseを返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await isAdmin("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("hasViewPermission", () => {
    it("権限がある場合はtrueを返す", async () => {
      const now = Date.now();
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: {
          items: [
            {
              record_id: "rec1",
              fields: {
                [USER_PERMISSION_FIELDS.lark_user_id]: "user001",
                [USER_PERMISSION_FIELDS.user_name]: "山田太郎",
                [USER_PERMISSION_FIELDS.user_email]: "yamada@example.com",
                [USER_PERMISSION_FIELDS.role]: "viewer",
                [USER_PERMISSION_FIELDS.granted_at]: now,
                [USER_PERMISSION_FIELDS.created_at]: now,
                [USER_PERMISSION_FIELDS.updated_at]: now,
              },
            },
          ],
        },
      } as any);

      const result = await hasViewPermission("user001");

      expect(result).toBe(true);
    });

    it("権限がない場合はfalseを返す", async () => {
      vi.mocked(getBaseRecords).mockResolvedValue({
        data: { items: [] },
      } as any);

      const result = await hasViewPermission("nonexistent");

      expect(result).toBe(false);
    });
  });
});
