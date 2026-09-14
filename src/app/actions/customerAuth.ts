"use server";

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { sendMail } from "@/lib/mailer";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

export async function requestCustomerLogin(email: string, key: string) {
  try {
    const license = await prisma.license.findUnique({
      where: { key },
      include: { customer: true, builder: { include: { settings: true } } }
    });

    if (!license) return { success: false, message: "Invalid email or license key." };
    if (license.customer.email !== email) return { success: false, message: "Invalid email or license key." };
    
    if (license.isLocked) {
      return { success: false, message: "This license has been locked due to too many failed attempts. Please contact support." };
    }

    if (license.status === "FROZEN" || license.status === "DISABLED") {
      return { success: false, message: `This license is currently ${license.status.toLowerCase()}.` };
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete existing OTPs for this license
    await prisma.customerOTP.deleteMany({
      where: { licenseId: license.id }
    });

    await prisma.customerOTP.create({
      data: {
        email,
        licenseId: license.id,
        otpHash,
        expiresAt
      }
    });

    // Send email
    const mailBrand = license.builder.settings?.name || "License Portal";
    
    // Note: We use the system mailer, but since we are multi-tenant, 
    // ideally we'd configure nodemailer dynamically per builder if they had their own SMTP.
    // For now, we use the global mailer which reads from process.env, 
    // but we can inject their brand name into the template.
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>${mailBrand} - Login Verification</h2>
        <p>You requested to log into the License Portal. Please use the verification code below:</p>
        <div style="background: #f4f4f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #71717a; font-size: 12px; margin-top: 40px;">If you did not request this code, please ignore this email.</p>
      </div>
    `;

    await sendMail({
      to: email,
      subject: `Your Login Code for ${mailBrand}`,
      html
    });

    return { success: true };
  } catch (error: any) {
    console.error("Login Request Error:", error);
    return { success: false, message: "An error occurred while requesting login." };
  }
}

export async function verifyCustomerOTP(email: string, key: string, otp: string) {
  try {
    const license = await prisma.license.findUnique({
      where: { key },
      include: { customer: true }
    });

    if (!license || license.customer.email !== email) {
      return { success: false, message: "Invalid credentials." };
    }

    if (license.isLocked) {
      return { success: false, message: "License is locked." };
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
      // Failed attempt
      const newAttempts = record.attempts + 1;
      
      if (newAttempts >= 3) {
        // Burn this OTP
        await prisma.customerOTP.delete({ where: { id: record.id } });
        
        // Increment master fails
        const newMasterFails = license.customerLoginFails + 1;
        const isLocked = newMasterFails >= 9;

        await prisma.license.update({
          where: { id: license.id },
          data: { 
            customerLoginFails: newMasterFails,
            isLocked
          }
        });

        if (isLocked) {
          return { success: false, message: "Too many failed attempts across multiple codes. Your license has been locked for security." };
        }

        return { success: false, message: "Too many failed attempts. Code burned. Please request a new one." };
      } else {
        // Just update attempts
        await prisma.customerOTP.update({
          where: { id: record.id },
          data: { attempts: newAttempts }
        });
        return { success: false, message: "Invalid code. Please try again." };
      }
    }

    // Success!
    // Delete OTP, reset master fails
    await prisma.$transaction([
      prisma.customerOTP.delete({ where: { id: record.id } }),
      prisma.license.update({
        where: { id: license.id },
        data: { customerLoginFails: 0 }
      })
    ]);

    // Create session
    const cookieStore = await cookies();
    cookieStore.set("customer_session", license.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/"
    });

    return { success: true };
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return { success: false, message: "An error occurred during verification." };
  }
}

export async function logoutCustomer() {
  const cookieStore = await cookies();
  cookieStore.delete("customer_session");
}
