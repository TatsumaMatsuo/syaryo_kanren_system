import { describe, it, expect, vi, beforeEach } from "vitest";

// QRCodeライブラリをモック
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(),
    toBuffer: vi.fn(),
  },
}));

import QRCode from "qrcode";
import {
  generateQRCodeDataUrl,
  generateQRCodeBuffer,
  generateVerificationQRCode,
} from "@/services/qrcode.service";

describe("qrcode.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateQRCodeDataUrl", () => {
    it("QRコードのDataURLを生成する", async () => {
      const mockDataUrl = "data:image/png;base64,mockImageData";
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataUrl);

      const result = await generateQRCodeDataUrl("https://example.com/verify/abc123");

      expect(result).toBe(mockDataUrl);
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        "https://example.com/verify/abc123",
        expect.objectContaining({
          width: 200,
          margin: 2,
        })
      );
    });

    it("カスタムオプションでQRコードを生成する", async () => {
      const mockDataUrl = "data:image/png;base64,mockImageData";
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataUrl);

      const result = await generateQRCodeDataUrl("https://example.com", {
        width: 300,
        margin: 4,
        darkColor: "#333333",
        lightColor: "#f0f0f0",
      });

      expect(result).toBe(mockDataUrl);
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        "https://example.com",
        expect.objectContaining({
          width: 300,
          margin: 4,
          color: {
            dark: "#333333",
            light: "#f0f0f0",
          },
        })
      );
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(QRCode.toDataURL).mockRejectedValue(new Error("QR Error"));

      await expect(generateQRCodeDataUrl("https://example.com")).rejects.toThrow(
        "QRコードの生成に失敗しました"
      );
    });
  });

  describe("generateQRCodeBuffer", () => {
    it("QRコードのBufferを生成する", async () => {
      const mockBuffer = Buffer.from("mockImageData");
      vi.mocked(QRCode.toBuffer).mockResolvedValue(mockBuffer);

      const result = await generateQRCodeBuffer("https://example.com/verify/abc123");

      expect(result).toBe(mockBuffer);
      expect(QRCode.toBuffer).toHaveBeenCalledWith(
        "https://example.com/verify/abc123",
        expect.objectContaining({
          width: 200,
          margin: 2,
        })
      );
    });

    it("カスタムオプションでBufferを生成する", async () => {
      const mockBuffer = Buffer.from("mockImageData");
      vi.mocked(QRCode.toBuffer).mockResolvedValue(mockBuffer);

      const result = await generateQRCodeBuffer("https://example.com", {
        width: 400,
        margin: 1,
      });

      expect(result).toBe(mockBuffer);
      expect(QRCode.toBuffer).toHaveBeenCalledWith(
        "https://example.com",
        expect.objectContaining({
          width: 400,
          margin: 1,
        })
      );
    });

    it("エラー時は例外をスローする", async () => {
      vi.mocked(QRCode.toBuffer).mockRejectedValue(new Error("QR Error"));

      await expect(generateQRCodeBuffer("https://example.com")).rejects.toThrow(
        "QRコードの生成に失敗しました"
      );
    });
  });

  describe("generateVerificationQRCode", () => {
    it("検証URL用のQRコードを生成する", async () => {
      const mockDataUrl = "data:image/png;base64,mockImageData";
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataUrl);

      const result = await generateVerificationQRCode(
        "https://example.com",
        "abc123-token"
      );

      expect(result).toBe(mockDataUrl);
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        "https://example.com/verify/abc123-token",
        expect.any(Object)
      );
    });

    it("カスタムオプション付きで検証QRコードを生成する", async () => {
      const mockDataUrl = "data:image/png;base64,mockImageData";
      vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataUrl);

      const result = await generateVerificationQRCode(
        "https://example.com",
        "abc123-token",
        { width: 250 }
      );

      expect(result).toBe(mockDataUrl);
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        "https://example.com/verify/abc123-token",
        expect.objectContaining({
          width: 250,
        })
      );
    });
  });
});
