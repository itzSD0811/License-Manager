"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/mailer";

const prisma = new PrismaClient();

import crypto from "crypto";

function generateLicenseKey() {
  const secret = process.env.LICENSE_KEY_SECRET || "fallback-secret";
  const rawBytes = crypto.randomBytes(12).toString("hex").toUpperCase();
  const hmac = crypto.createHmac("sha256", secret).update(rawBytes).digest("hex").toUpperCase();
  const combined = (rawBytes + hmac).substring(0, 24);
  return combined.match(/.{1,4}/g)?.join("-") || combined;
}

export async function createLicense(formData: FormData) {
  const builderEmail = formData.get("builderEmail") as string;
  const productId = formData.get("productId") as string;
  const customerEmail = formData.get("customerEmail") as string;
  const customerName = formData.get("customerName") as string;
  const countryRegion = formData.get("countryRegion") as string;
  const rateLimit = formData.get("rateLimit") as string;
  const rateLimitWindow = formData.get("rateLimitWindow") as string;
  
  const expireYears = formData.get("expireYears") as string;
  const expireMonths = formData.get("expireMonths") as string;
  const expireDays = formData.get("expireDays") as string;

  if (!builderEmail || !productId || !customerEmail || !customerName) {
    throw new Error("Missing required fields");
  }

  const builder = await prisma.builder.findUnique({ where: { email: builderEmail } });
  if (!builder) throw new Error("Builder not found");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.builderId !== builder.id) throw new Error("Product not found");

  // Upsert customer
  const customer = await prisma.customer.upsert({
    where: { id: "dummy" },
    create: { email: customerEmail, name: customerName, countryRegion: countryRegion || null, builderId: builder.id },
    update: { name: customerName, countryRegion: countryRegion || null },
  }).catch(async () => {
    let existingCustomer = await prisma.customer.findFirst({ where: { email: customerEmail, builderId: builder.id } });
    if (!existingCustomer) {
      existingCustomer = await prisma.customer.create({
        data: { email: customerEmail, name: customerName, countryRegion: countryRegion || null, builderId: builder.id }
      });
    } else {
      existingCustomer = await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: { name: customerName, countryRegion: countryRegion || null }
      });
    }
    return existingCustomer;
  });

  const key = generateLicenseKey();

  const startAtActivation = formData.get("startAtActivation") === "true";

  let expiresAt: Date | null = null;
  const y = parseInt(expireYears || "0", 10);
  const m = parseInt(expireMonths || "0", 10);
  const d = parseInt(expireDays || "0", 10);

  if (!startAtActivation && (y > 0 || m > 0 || d > 0)) {
    expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + y);
    expiresAt.setMonth(expiresAt.getMonth() + m);
    expiresAt.setDate(expiresAt.getDate() + d);
  }

  const rateLimitInt = rateLimit ? parseInt(rateLimit, 10) : null;
  const shortId = crypto.randomBytes(3).toString("hex").toUpperCase();

  await prisma.license.create({
    data: {
      id: shortId,
      key,
      builderId: builder.id,
      productId: product.id,
      customerId: customer.id,
      status: "Not Activated",
      expiresAt,
      expireYears: y > 0 ? y : null,
      expireMonths: m > 0 ? m : null,
      expireDays: d > 0 ? d : null,
      startAtActivation,
      rateLimit: rateLimitInt,
      rateLimitWindow: rateLimitInt ? (rateLimitWindow || "days") : null,
    }
  });

  const builderSettings = await prisma.builderSettings.findUnique({ where: { builderId: builder.id } });
  const brandName = builderSettings?.name || "License Portal";
  
  await sendMail({
    to: customerEmail,
    subject: `Your new license for ${product.name}`,
    html: `
      <h2>Hello ${customerName},</h2>
      <p>Your new license key for <strong>${product.name}</strong> has been created!</p>
      <div style="background: #f4f4f5; padding: 15px; margin: 20px 0; font-family: monospace; font-size: 18px;">
        ${key}
      </div>
      <p>Login to the <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login">Customer Portal</a> to manage your license.</p>
    `
  });

  revalidatePath("/builder/dashboard/licenses");
}

export async function deleteLicense(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing license ID");
  await prisma.license.delete({ where: { id } });
  revalidatePath("/builder/dashboard/licenses");
}

export async function toggleLicenseStatus(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  const license = await prisma.license.findUnique({ where: { id } });
  if (license) {
    const newStatus = license.status === "Active" ? "Disabled" : "Active";
    await prisma.license.update({ where: { id }, data: { status: newStatus } });
    revalidatePath("/builder/dashboard/licenses");
  }
}

export async function toggleLicenseFreeze(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  const license = await prisma.license.findUnique({ where: { id } });
  if (license) {
    await prisma.license.update({ where: { id }, data: { isFrozen: !license.isFrozen } });
    revalidatePath("/builder/dashboard/licenses");
  }
}

export async function toggleLicenseLock(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  const license = await prisma.license.findUnique({ where: { id } });
  if (license) {
    await prisma.license.update({ where: { id }, data: { isLocked: !license.isLocked } });
    revalidatePath("/builder/dashboard/licenses");
  }
}

export async function resetRateLimit(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.license.update({ where: { id }, data: { rateLimitHits: 0, rateLimitResetAt: new Date() } });
  revalidatePath("/builder/dashboard/licenses");
}

export async function unassignHost(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.licenseInstallation.deleteMany({ where: { licenseId: id } });
  revalidatePath("/builder/dashboard/licenses");
}

export async function editLicense(formData: FormData) {
  const id = formData.get("id") as string;
  const customerName = formData.get("customerName") as string;
  const customerEmail = formData.get("customerEmail") as string;
  const countryRegion = formData.get("countryRegion") as string;
  if (!id) return;

  const license = await prisma.license.findUnique({ where: { id }, include: { customer: true } });
  if (license && license.customer) {
    await prisma.customer.update({
      where: { id: license.customer.id },
      data: { name: customerName, email: customerEmail, countryRegion: countryRegion || null }
    });
    revalidatePath("/builder/dashboard/licenses");
  }
}

export async function renewLicense(formData: FormData) {
  const id = formData.get("id") as string;
  const renewYears = parseInt((formData.get("renewYears") as string) || "0", 10);
  const renewMonths = parseInt((formData.get("renewMonths") as string) || "0", 10);
  const renewDays = parseInt((formData.get("renewDays") as string) || "0", 10);
  
  if (!id) return;
  const license = await prisma.license.findUnique({ where: { id } });
  if (license) {
    let baseDate = license.expiresAt && license.expiresAt > new Date() ? license.expiresAt : new Date();
    baseDate.setFullYear(baseDate.getFullYear() + renewYears);
    baseDate.setMonth(baseDate.getMonth() + renewMonths);
    baseDate.setDate(baseDate.getDate() + renewDays);
    
    await prisma.license.update({
      where: { id },
      data: { expiresAt: baseDate }
    });
    revalidatePath("/builder/dashboard/licenses");
  }
}
