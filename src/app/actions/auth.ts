"use server";

import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import speakeasy from "speakeasy";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function check2FAStatus(email: string) {
  const builder = await prisma.builder.findUnique({
    where: { email },
    include: { settings: true }
  });
  return builder?.settings?.twoFactorEnabled || false;
}

export async function verify2FACode(email: string, code: string, isBackup: boolean) {
  const builder = await prisma.builder.findUnique({
    where: { email },
    include: { settings: { include: { backupCodes: true } } }
  });

  if (!builder || !builder.settings) return false;
  
  if (isBackup) {
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const backupCode = builder.settings.backupCodes.find(bc => bc.codeHash === codeHash && !bc.used);
    
    if (backupCode) {
      await prisma.twoFactorBackupCode.update({
        where: { id: backupCode.id },
        data: { used: true, usedAt: new Date() }
      });
      return true;
    }
    return false;
  }

  // TOTP Verification
  if (!builder.settings.twoFactorSecret) return false;
  
  return speakeasy.totp.verify({
    secret: builder.settings.twoFactorSecret,
    encoding: "base32",
    token: code.trim(),
    window: 2
  });
}

export async function set2FAVerifiedSession() {
  (await cookies()).set("2fa_verified", "true", { path: "/" });
}
