import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PermitTemplate, PermitTemplateProps, CompanyInfo } from "@/components/pdf/permit-template";
import { generateVerificationQRCode } from "./qrcode.service";
import { getCompanyInfo } from "./system-settings.service";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// uploadsディレクトリが存在しない場合は作成
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface GeneratePermitPdfInput {
  employeeName: string;
  vehicleNumber: string;
  vehicleModel: string;
  issueDate: Date;
  expirationDate: Date;
  permitId: string;
  verificationToken: string;
  baseUrl: string;
}

/**
 * 許可証PDFを生成してファイルに保存
 * @returns 保存されたファイルのキー（file_key）
 */
export async function generatePermitPdf(
  input: GeneratePermitPdfInput
): Promise<string> {
  try {
    // QRコードを生成
    const qrCodeDataUrl = await generateVerificationQRCode(
      input.baseUrl,
      input.verificationToken
    );

    // 会社情報を取得
    const companyInfo: CompanyInfo = await getCompanyInfo();

    // PDFテンプレートのprops
    const templateProps: PermitTemplateProps = {
      employeeName: input.employeeName,
      vehicleNumber: input.vehicleNumber,
      vehicleModel: input.vehicleModel,
      issueDate: input.issueDate,
      expirationDate: input.expirationDate,
      qrCodeDataUrl,
      permitId: input.permitId,
      companyInfo,
    };

    // PDFをバッファとして生成
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(PermitTemplate, templateProps) as any
    );

    // ファイルキーを生成
    const fileKey = `permit_${Date.now()}_${crypto.randomBytes(8).toString("hex")}.pdf`;
    const filePath = path.join(UPLOAD_DIR, fileKey);

    // ファイルに保存
    fs.writeFileSync(filePath, pdfBuffer);

    console.log(`許可証PDFを生成しました: ${fileKey}`);
    return fileKey;
  } catch (error) {
    console.error("許可証PDF生成エラー:", error);
    throw new Error("許可証PDFの生成に失敗しました");
  }
}

/**
 * 許可証PDFをバッファとして生成（プレビュー用）
 */
export async function generatePermitPdfBuffer(
  input: GeneratePermitPdfInput
): Promise<Buffer> {
  try {
    // QRコードを生成
    const qrCodeDataUrl = await generateVerificationQRCode(
      input.baseUrl,
      input.verificationToken
    );

    // 会社情報を取得
    const companyInfo: CompanyInfo = await getCompanyInfo();

    // PDFテンプレートのprops
    const templateProps: PermitTemplateProps = {
      employeeName: input.employeeName,
      vehicleNumber: input.vehicleNumber,
      vehicleModel: input.vehicleModel,
      issueDate: input.issueDate,
      expirationDate: input.expirationDate,
      qrCodeDataUrl,
      permitId: input.permitId,
      companyInfo,
    };

    // PDFをバッファとして生成
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(PermitTemplate, templateProps) as any
    );

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("許可証PDF生成エラー:", error);
    throw new Error("許可証PDFの生成に失敗しました");
  }
}

/**
 * 保存されたPDFファイルを取得
 */
export function getPermitPdfPath(fileKey: string): string | null {
  const filePath = path.join(UPLOAD_DIR, fileKey);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}

/**
 * 保存されたPDFファイルをバッファとして読み込む
 */
export function readPermitPdf(fileKey: string): Buffer | null {
  const filePath = getPermitPdfPath(fileKey);
  if (filePath) {
    return fs.readFileSync(filePath);
  }
  return null;
}
