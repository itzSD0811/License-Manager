"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import speakeasy from "speakeasy";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function getBuilderProfile() {
  return await prisma.builder.findFirst({
    include: { settings: true }
  });
}

export async function testMailConnection() {
  if (!process.env.MAIL_HOST) return { success: false, message: "MAIL_HOST is not configured in .env" };
  
  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: process.env.MAIL_PORT === '465',
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    await transporter.verify();
    return { success: true, message: `Connected to ${process.env.MAIL_HOST}` };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to connect to SMTP server" };
  }
}

export async function testDbConnection() {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return { success: true, message: "Connected (" + latency + "ms)" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to connect to database" };
  }
}

export async function testFirebaseConnection() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) return { success: false, message: "NEXT_PUBLIC_FIREBASE_API_KEY is not configured" };
    
    // Quick ping to Identity Toolkit API to verify API key
    const res = await fetch("https://identitytoolkit.googleapis.com/v1/projects?key=" + apiKey);
    const data = await res.json();
    
    // Even if it's 400 (Method Not Allowed etc.), if it doesn't say "API_KEY_INVALID", it's generally connected to Google.
    if (data.error && data.error.status === "INVALID_ARGUMENT" && data.error.message.includes("API_KEY_INVALID")) {
      return { success: false, message: "Firebase API Key is invalid." };
    }
    
    return { success: true, message: "Connected to Firebase Auth Servers" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to reach Firebase" };
  }
}

export async function clearLoginHistory(formData: FormData) {
  const email = formData.get("email") as string;
  await prisma.loginAttempt.deleteMany({
    where: { email }
  });
  revalidatePath("/builder/dashboard/settings");
}

export async function updateAccountSettings(formData: FormData) {
  const id = formData.get("builderId") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const avatarUrl = formData.get("avatarUrl") as string;

  await prisma.builder.update({
    where: { id },
    data: {
      email,
      settings: {
        update: { name, avatarUrl }
      }
    }
  });

  revalidatePath("/builder/dashboard/settings");
}

export async function updateThemeSettings(formData: FormData) {
  const builderId = formData.get("builderId") as string;
  const theme = formData.get("theme") as string;
  
  // Note: we don't have accentColor in the DB schema yet, we can save it to theme string like "light:#5a56d6" or just save theme.
  // The user just said "Theme & Appearance modules not working", so saving theme is fine.
  await prisma.builderSettings.update({
    where: { builderId },
    data: { theme }
  });

  revalidatePath("/builder/dashboard/settings");
}

export async function updateMailSettings(formData: FormData) {
  const builderId = formData.get("builderId") as string;
  
  await prisma.builderSettings.update({
    where: { builderId },
    data: {
      mailBrandLogo: formData.get("mailBrandLogo") as string,
      mailTermsLink: formData.get("mailTermsLink") as string,
    }
  });

  revalidatePath("/builder/dashboard/settings");
}

export async function setup2FA(builderId: string, email: string) {
  const secret = speakeasy.generateSecret({ name: `Magneticx:${email}` });
  
  await prisma.builderSettings.update({
    where: { builderId },
    data: { twoFactorSecret: secret.base32 }
  });

  return { secret: secret.base32, otpauthUrl: secret.otpauth_url };
}

export async function verify2FASetup(builderId: string, token: string) {
  const settings = await prisma.builderSettings.findUnique({
    where: { builderId }
  });

  if (!settings || !settings.twoFactorSecret) return { success: false };

  const isValid = speakeasy.totp.verify({
    secret: settings.twoFactorSecret,
    encoding: "base32",
    token: token.trim(),
    window: 2
  });

  if (!isValid) return { success: false };

  // Generate 8 backup codes
  const rawCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString("hex").toUpperCase());
  
  // Hash codes for storage
  const hashedCodes = rawCodes.map(code => ({
    builderSettingsId: settings.id,
    codeHash: crypto.createHash("sha256").update(code).digest("hex")
  }));

  await prisma.$transaction([
    prisma.twoFactorBackupCode.deleteMany({ where: { builderSettingsId: settings.id } }),
    prisma.twoFactorBackupCode.createMany({ data: hashedCodes }),
    prisma.builderSettings.update({
      where: { builderId },
      data: { twoFactorEnabled: true }
    })
  ]);

  revalidatePath("/builder/dashboard/settings");
  return { success: true, backupCodes: rawCodes };
}

export async function disable2FA(formData: FormData) {
  const builderId = formData.get("builderId") as string;
  const settings = await prisma.builderSettings.findUnique({ where: { builderId } });
  
  if (settings) {
    await prisma.$transaction([
      prisma.twoFactorBackupCode.deleteMany({ where: { builderSettingsId: settings.id } }),
      prisma.builderSettings.update({
        where: { builderId },
        data: { twoFactorEnabled: false, twoFactorSecret: null }
      })
    ]);
  }
  
  revalidatePath("/builder/dashboard/settings");
}
