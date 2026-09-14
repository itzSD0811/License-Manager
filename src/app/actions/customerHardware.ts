"use server";

import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import crypto from "crypto";
import { sendMail } from "@/lib/mailer";
import { logoutCustomer } from "./customerAuth";

const prisma = new PrismaClient();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

async function getSessionLicense() {
  const cookieStore = await cookies();
  const session = cookieStore.get("customer_session")?.value;
  if (!session) return null;
  
  return prisma.license.findUnique({
    where: { id: session },
    include: {
      customer: true,
      builder: { include: { settings: true } },
      product: true
    }
  });
}

export async function requestUnassignOTP() {
  try {
    const license = await getSessionLicense();
    if (!license) return { success: false, message: "Unauthorized" };

    const otp = generateOTP();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.customerOTP.deleteMany({
      where: { licenseId: license.id }
    });

    await prisma.customerOTP.create({
      data: {
        email: license.customer.email,
        licenseId: license.id,
        otpHash,
        expiresAt
      }
    });

    const mailBrand = license.builder.settings?.name || "License Portal";
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>${mailBrand} - Unassign Machine Verification</h2>
        <p>You requested to unassign the current machine from your license (${license.product.name}). Please use the verification code below to confirm this action:</p>
        <div style="background: #f4f4f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #71717a; font-size: 12px; margin-top: 40px;">If you did not request this code, please ignore this email.</p>
      </div>
    `;

    await sendMail({
      to: license.customer.email,
      subject: `Your Machine Unassign Code for ${mailBrand}`,
      html
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function verifyUnassignOTP(otp: string) {
  try {
    const license = await getSessionLicense();
    if (!license) return { success: false, message: "Unauthorized", logout: true };

    if (license.isLocked) {
      await logoutCustomer();
      return { success: false, message: "License is locked.", logout: true };
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const record = await prisma.customerOTP.findFirst({
      where: { licenseId: license.id }
    });

    if (!record) {
      return { success: false, message: "No active verification code found. Please request a new one." };
    }

    if (record.expiresAt < new Date()) {
      await prisma.customerOTP.delete({ where: { id: record.id } });
      return { success: false, message: "Verification code expired. Please request a new one." };
    }

    if (record.otpHash !== otpHash) {
      const newAttempts = record.attempts + 1;
      
      if (newAttempts >= 3) {
        await prisma.customerOTP.delete({ where: { id: record.id } });
        
        const newMasterFails = license.customerLoginFails + 1;
        const isLocked = newMasterFails >= 3; // 3 failed OTPs = 9 total attempts

        await prisma.license.update({
          where: { id: license.id },
          data: { 
            customerLoginFails: newMasterFails,
            isLocked
          }
        });

        if (isLocked) {
          await logoutCustomer();
          return { success: false, message: "Too many failed attempts. Your license has been locked and you have been logged out.", logout: true };
        }

        return { success: false, message: "Too many failed attempts. Code burned. Please request a new one." };
      } else {
        await prisma.customerOTP.update({
          where: { id: record.id },
          data: { attempts: newAttempts }
        });
        return { success: false, message: "Invalid code. Please try again." };
      }
    }

    // Success: Delete OTP, Reset fails, Unassign all hardware
    await prisma.$transaction([
      prisma.customerOTP.delete({ where: { id: record.id } }),
      prisma.license.update({
        where: { id: license.id },
        data: { customerLoginFails: 0 }
      }),
      prisma.licenseInstallation.deleteMany({
        where: { licenseId: license.id }
      })
    ]);

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
